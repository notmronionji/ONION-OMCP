import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, Bell, Blocks, Cable, Check, ChevronDown,
  ChevronRight, CircleHelp, Cpu, FileCode2, Globe2, HardDrive, LayoutDashboard,
  LifeBuoy, LockKeyhole, Menu, MoreHorizontal, Network, Plus, RadioTower, Search,
  Server, Settings2, ShieldCheck, Sparkles, Users, Wifi, X, Zap,
} from 'lucide-react'

type Page = 'Overview' | 'Servers' | 'Routing' | 'Connectors' | 'Users' | 'Extensions' | 'Settings'
type ServerItem = {
  id: string; name: string; game: string; address: string; state: 'Online' | 'Offline'
  cpu: number; ram: string; accent: string; software: string; version: string; memory: number; port: number
}
type CreatePayload = { name: string; software: string; version: string; memory: number; cpuLimit: number; port: number; eulaAccepted: boolean }
type RouteInfo = { status?: string; provider?: string; address?: string | null; logs?: string }

async function api<T=any>(path: string, token = '', init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {})
  if (token) headers.set('X-OMCP-Session', token)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  let response: Response
  try { response = await fetch(path, { ...init, headers }) }
  catch { throw new Error('OMCP API तक connection नहीं हो पाया। Agent service और current panel link check करें।') }
  const data = await response.json().catch(() => ({ error: 'OMCP API ने invalid response दिया। Agent log check करें।' }))
  if (!response.ok) throw new Error(data.error || `API error HTTP ${response.status}`)
  return data as T
}

function mapServer(s: any): ServerItem {
  const software = String(s.software || 'paper').toLowerCase()
  return {
    id: s.id, name: s.name, software, version: s.version,
    game: `${software[0].toUpperCase()+software.slice(1)} · ${s.version}`,
    address: `127.0.0.1:${s.port}`,
    state: s.status === 'running' ? 'Online' : 'Offline',
    cpu: 0, ram: `${s.memory} GB`, accent: software === 'purpur' ? 'violet' : software === 'fabric' ? 'orange' : 'lime',
    memory: Number(s.memory || 0), port: Number(s.port || 25565),
  }
}

const navItems: { label: Page; icon: typeof LayoutDashboard; group: string }[] = [
  { label: 'Overview', icon: LayoutDashboard, group: 'WORKSPACE' },
  { label: 'Servers', icon: Server, group: 'WORKSPACE' },
  { label: 'Routing', icon: Network, group: 'INFRASTRUCTURE' },
  { label: 'Connectors', icon: Cable, group: 'INFRASTRUCTURE' },
  { label: 'Users', icon: Users, group: 'MANAGEMENT' },
  { label: 'Extensions', icon: Blocks, group: 'MANAGEMENT' },
  { label: 'Settings', icon: Settings2, group: 'SYSTEM' },
]

function App() {
  const [page, setPage] = useState<Page>('Overview')
  const [servers, setServers] = useState<ServerItem[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('Administrator')
  const [authReady, setAuthReady] = useState(false)
  const [setupRequired, setSetupRequired] = useState(false)

  const filteredServers = useMemo(() => servers.filter(s => s.name.toLowerCase().includes(search.toLowerCase())), [servers, search])
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 4000) }
  const refreshServers = async (session = token) => {
    const result = await api<{servers:any[]}>('/api/servers', session)
    setServers(result.servers.map(mapServer))
  }

  useEffect(() => {
    let alive = true
    const saved = localStorage.getItem('omcp-session') || ''
    ;(async () => {
      const status = await api<{setupRequired:boolean}>('/api/setup/status')
      if (!alive) return
      setSetupRequired(status.setupRequired)
      if (saved) {
        try {
          const me = await api<{user:{username:string}}>('/api/me', saved)
          const list = await api<{servers:any[]}>('/api/servers', saved)
          if (!alive) return
          setToken(saved); setUsername(me.user.username); setServers(list.servers.map(mapServer))
        } catch { localStorage.removeItem('omcp-session') }
      }
      if (alive) setAuthReady(true)
    })().catch(e => { if (alive) { setNotice(e.message); setAuthReady(true) } })
    return () => { alive = false }
  }, [])

  const authenticate = async (name: string, password: string) => {
    const endpoint = setupRequired ? '/api/setup' : '/api/login'
    const result = await api<{token:string;user:{username:string}}>(endpoint, '', { method:'POST', body:JSON.stringify({username:name,password}) })
    localStorage.setItem('omcp-session', result.token)
    setToken(result.token); setUsername(result.user.username)
    await refreshServers(result.token)
  }

  const logout = async () => {
    try { await api('/api/logout', token, {method:'POST',body:'{}'}) } catch {}
    localStorage.removeItem('omcp-session'); setToken(''); setServers([])
  }

  const createServer = async (payload: CreatePayload) => {
    const job = await api<{jobId:string}>('/api/servers', token, {method:'POST',body:JSON.stringify(payload)})
    for (let attempt=0; attempt<300; attempt++) {
      await new Promise(resolve => window.setTimeout(resolve, 1000))
      const state = await api<{status:string;message:string;server?:any;error?:string}>(`/api/server-creation/${job.jobId}`, token)
      if (state.status === 'failed') throw new Error(state.error || state.message || 'Server creation failed')
      if (state.status === 'complete') {
        await refreshServers()
        setPage('Servers')
        notify(`Server "${state.server?.name || payload.name}" successfully created. अब इसे Start कर सकते हैं।`)
        return
      }
    }
    throw new Error('Server download अभी भी चल रहा है। Servers page refresh करके status देखें।')
  }

  const toggleServer = async (server: ServerItem) => {
    const action = server.state === 'Online' ? 'stop' : 'start'
    try {
      await api(`/api/servers/${server.id}/${action}`, token, {method:'POST',body:'{}'})
      await refreshServers()
      notify(action === 'start' ? 'Server start command भेज दिया गया।' : 'Server stop command भेज दिया गया।')
    } catch(e) { notify((e as Error).message) }
  }

  if (!authReady) return <div className="auth-screen"><div className="auth-card"><div className="brand-name">OMCP<span>.</span></div><p>Connecting to your local Minecraft agent…</p></div></div>
  if (!token) return <AuthScreen setupRequired={setupRequired} onSubmit={authenticate} error={notice}/>

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup"><div className="brand-mark"><span>O</span><i /></div><div><div className="brand-name">OMCP<span>.</span></div><div className="brand-caption">ONION CONTROL PLANE</div></div><button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={17}/></button></div>
        <div className="workspace-switch"><div className="workspace-avatar">OC</div><div className="workspace-copy"><b>OnionCraft</b><span>Personal workspace</span></div><ChevronDown size={15} className="muted-icon"/></div>
        <nav className="main-nav">{['WORKSPACE','INFRASTRUCTURE','MANAGEMENT','SYSTEM'].map(group => <div className="nav-group" key={group}><div className="nav-label">{group}</div>{navItems.filter(item => item.group === group).map(item => { const Icon=item.icon; return <button key={item.label} className={`nav-link ${page===item.label?'active':''}`} onClick={()=>{setPage(item.label);setMobileNav(false)}}><Icon size={17}/><span>{item.label}</span>{item.label==='Routing'&&<span className="nav-live-dot"/>}{item.label==='Servers'&&<small>{servers.length}</small>}</button> })}</div>)}</nav>
        <div className="sidebar-bottom"><div className="plan-card"><div className="plan-icon"><Sparkles size={15}/></div><div><b>OMCP Core</b><span>Local agent connected</span></div><span className="tiny-online">●</span><div className="plan-meter"><i/></div><small>Real server engine enabled</small></div><button className="nav-link"><LifeBuoy size={17}/><span>Documentation</span><ArrowUpRight size={13} className="end-icon"/></button><div className="profile-row"><div className="profile-avatar">O</div><div className="profile-copy"><b>{username}</b><span>Administrator</span></div><button className="icon-button" onClick={logout} title="Sign out"><LockKeyhole size={16}/></button></div></div>
      </aside>
      {mobileNav && <button className="mobile-scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={()=>setMobileNav(true)} aria-label="Open menu"><Menu size={19}/></button><div className="breadcrumb">Workspace <ChevronRight size={13}/> <b>{page}</b></div></div><div className="topbar-actions"><div className="system-pill"><span/>Agent connected</div><button className="icon-button" aria-label="Help"><CircleHelp size={17}/></button><button className="icon-button notification-button" onClick={()=>notify('You are all caught up.')} aria-label="Notifications"><Bell size={17}/><i/></button><div className="top-avatar">O</div></div></header>
        <div className="page-content">
          {page==='Overview'&&<Overview servers={servers} onCreate={()=>setCreateOpen(true)} onNavigate={setPage}/>}
          {page==='Servers'&&<ServersPage servers={filteredServers} search={search} setSearch={setSearch} onCreate={()=>setCreateOpen(true)} onToggle={toggleServer}/>}
          {page==='Routing'&&<RoutingPage servers={servers} token={token} onRefresh={refreshServers} notify={notify}/>}
          {page==='Connectors'&&<ConnectorsPage/>}
          {page==='Users'&&<PlaceholderPage title="Users & access" icon={Users} description="Manage panel accounts, roles and server-level permissions."/>}
          {page==='Extensions'&&<PlaceholderPage title="Extensions" icon={Blocks} description="Extend OMCP with reviewed integrations and automation."/>}
          {page==='Settings'&&<PlaceholderPage title="System settings" icon={Settings2} description="Configure panel identity, security and platform preferences."/>}
          <footer className="page-footer"><span>OMCP Panel <b>v0.2.0 · Agent build</b></span><span><i/> Local Minecraft agent online <span className="footer-sep">·</span> Real server provisioning</span></footer>
        </div>
      </main>
      {createOpen&&<CreateServerModal onClose={()=>setCreateOpen(false)} onCreate={createServer}/>}
      {notice&&<div className="toast"><Check size={16}/>{notice}</div>}
    </div>
  )
}

function AuthScreen({setupRequired,onSubmit,error}:{setupRequired:boolean;onSubmit:(u:string,p:string)=>Promise<void>;error:string}) {
  const [name,setName]=useState('admin'),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[localError,setLocalError]=useState('')
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setLocalError('');try{await onSubmit(name,password)}catch(err){setLocalError((err as Error).message)}finally{setBusy(false)}}
  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}><div className="brand-name">OMCP<span>.</span></div><div className="eyebrow">ONION MINECRAFT CONTROL PANEL</div><h1>{setupRequired?'Create administrator':'Welcome back'}</h1><p>{setupRequired?'पहली बार setup: अपना admin username और मजबूत password बनाएं।':'अपने OMCP administrator account से sign in करें।'}</p><label className="field-label">Username<input value={name} onChange={e=>setName(e.target.value)} minLength={3} maxLength={24} required autoComplete="username"/></label><label className="field-label">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={setupRequired?12:1} required autoComplete={setupRequired?'new-password':'current-password'}/></label>{(localError||error)&&<div className="auth-error">{localError||error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy?'Please wait…':setupRequired?'Create secure account':'Sign in'} <ArrowRight size={15}/></button>{setupRequired&&<small className="muted">Password कम से कम 12 characters का होना चाहिए।</small>}</form></div>
}

function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Overview({servers,onCreate,onNavigate}:{servers:ServerItem[];onCreate:()=>void;onNavigate:(p:Page)=>void}) {
  const online=servers.filter(s=>s.state==='Online').length
  const memory=servers.reduce((n,s)=>n+s.memory,0)
  return <><PageHeading eyebrow="CONTROL CENTER / OVERVIEW" title="Good evening, Admin." description="Your actual Minecraft instances and local host status." action={<button className="primary-button" onClick={onCreate}><Plus size={16}/> Create server</button>}/>
    <div className="welcome-strip"><div className="welcome-glow"/><div className="welcome-icon"><Zap size={19}/></div><div className="welcome-copy"><b>Real server provisioning is connected.</b><span>OMCP downloads server software onto this host and manages the Java process.</span></div><button onClick={()=>onNavigate('Servers')}>View servers <ArrowRight size={15}/></button><div className="strip-orbit orbit-one"/><div className="strip-orbit orbit-two"/></div>
    <div className="stats-grid"><StatCard icon={Server} label="Created servers" value={String(servers.length).padStart(2,'0')} meta="Stored on this host" tone="green"/><StatCard icon={Activity} label="Running servers" value={String(online).padStart(2,'0')} meta="Live process detection" tone="blue"/><StatCard icon={Cpu} label="Allocated memory" value={memory+' GB'} meta="Across created instances" tone="purple"/><StatCard icon={HardDrive} label="Provisioning" value="Ready" meta="Paper, Purpur, Fabric, Vanilla+" tone="orange"/></div>
    <div className="content-grid"><section className="panel-card servers-panel"><div className="panel-heading"><div><h2>Recent servers</h2><p>Instances created on this host</p></div><button className="text-button" onClick={()=>onNavigate('Servers')}>View all <ArrowRight size={14}/></button></div><div className="server-list">{servers.slice(0,4).map(s=><ServerRow key={s.id} server={s}/>)}</div>{!servers.length&&<div className="empty-activity"><b>No servers created yet</b><span>Click Create server to download and install your first Minecraft server.</span></div>}<button className="add-server-row" onClick={onCreate}><span><Plus size={16}/></span> Create another server</button></section><section className="panel-card network-panel"><div className="panel-heading"><div><h2>Network overview</h2><p>Per-server TCP routing</p></div><span className="status-chip pending">ON DEMAND</span></div><div className="network-visual"><div className="network-ring ring-a"/><div className="network-ring ring-b"/><div className="network-center"><Globe2 size={25}/><span>OMCP</span></div><div className="network-node node-top"><RadioTower size={14}/></div><div className="network-node node-left"><Server size={14}/></div><div className="network-node node-right"><Network size={14}/></div></div><div className="network-foot"><div><span className="foot-dot amber"/> Routes <b>Start after server creation</b></div><button onClick={()=>onNavigate('Routing')}>Manage <ArrowRight size={13}/></button></div></section></div>
  </>
}

function StatCard({icon:Icon,label,value,meta,tone}:{icon:typeof Server;label:string;value:string;meta:string;tone:string}) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}><Icon size={17}/></span><span className="stat-period">LIVE</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-bottom"><span>{meta}</span></div></div>
}

function ServerRow({server}:{server:ServerItem}) {
  return <div className="server-row"><div className={`game-icon ${server.accent}`}><span>{server.software==='paper'?'P':server.software==='purpur'?'✦':'M'}</span></div><div className="server-info"><b>{server.name}</b><span>{server.game}</span></div><div className="server-address"><Globe2 size={12}/>{server.address}</div><div className={`server-state ${server.state.toLowerCase()}`}><i/>{server.state}</div></div>
}

function ServersPage({servers,search,setSearch,onCreate,onToggle}:{servers:ServerItem[];search:string;setSearch:(v:string)=>void;onCreate:()=>void;onToggle:(s:ServerItem)=>void}) {
  return <><PageHeading eyebrow="WORKSPACE / SERVERS" title="Your servers" description="Real Minecraft server folders, Java processes and resource allocations." action={<button className="primary-button" onClick={onCreate}><Plus size={16}/> Create server</button>}/><div className="toolbar"><div className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search servers..."/></div><span className="pill">{servers.length} instances</span></div><section className="panel-card full-table"><div className="table-head"><span>SERVER</span><span>LOCAL ADDRESS</span><span>STATUS</span><span>CPU</span><span>MEMORY</span><span>ACTION</span></div>{servers.map(s=><div className="table-row" key={s.id}><div className="table-server"><div className={`game-icon ${s.accent}`}>{s.software==='paper'?'P':s.software==='purpur'?'✦':'M'}</div><div><b>{s.name}</b><small>{s.game}</small></div></div><span className="table-address">{s.address}</span><span className={`server-state ${s.state.toLowerCase()}`}><i/>{s.state}</span><span>—</span><span>{s.ram}</span><button className="secondary-button server-power" onClick={()=>onToggle(s)}>{s.state==='Online'?'Stop':'Start'}</button></div>)}{servers.length===0&&<div className="empty-activity"><b>No servers found</b><span>There are no matching real server instances. Create one to begin.</span></div>}</section></>
}

function RoutingPage({servers,token,onRefresh,notify}:{servers:ServerItem[];token:string;onRefresh:()=>Promise<void>;notify:(s:string)=>void}) {
  const [providers,setProviders]=useState<Record<string,string>>({})
  const [routes,setRoutes]=useState<Record<string,RouteInfo>>({})
  const [busy,setBusy]=useState('')
  useEffect(()=>{let active=true;(async()=>{const entries=await Promise.all(servers.map(async s=>{try{return [s.id,await api<RouteInfo>(`/api/servers/${s.id}/tunnel`,token)] as const}catch{return [s.id,{status:'unknown'}] as const}}));if(active)setRoutes(Object.fromEntries(entries))})();return()=>{active=false}},[servers,token])
  const run=async(s:ServerItem,action:'start'|'stop')=>{const key=s.id;setBusy(key);try{const provider=providers[key]||'minekube';const result=await api<RouteInfo>(`/api/servers/${key}/tunnel/${action}`,token,{method:'POST',body:JSON.stringify({provider})});setRoutes(old=>({...old,[key]:result}));notify(action==='start'?'Routing request submitted.':'Route stopped.');await onRefresh()}catch(e){notify((e as Error).message)}finally{setBusy('')}}
  return <><PageHeading eyebrow="INFRASTRUCTURE / NETWORK" title="Routing & tunnels" description="Game TCP routes are configured per created server, separately from the web-panel HTTPS link."/><div className="routing-warning"><LockKeyhole size={18}/><div><b>Panel tunnel and Minecraft routes are separate</b><span>Cloudflare Quick Tunnel exposes this web panel only. Minecraft players need a TCP route from Minekube Connect, Bore or Pinggy.</span></div><span className="status-chip pending">TCP</span></div>{servers.length===0?<section className="panel-card routing-empty"><div className="empty-icon"><Network size={22}/></div><h2>Create a server first</h2><p>Once a Minecraft instance exists, its own routing controls will appear here. Start the server before using Bore or Pinggy.</p></section>:<div className="routing-server-list">{servers.map(s=>{const route=routes[s.id]||{};const provider=providers[s.id]||'minekube';const active=route.status==='running'||route.status==='installed'||route.status==='starting';return <section className="panel-card route-server-card" key={s.id}><div className="panel-heading"><div><h2>{s.name}</h2><p>{s.game} · local port {s.port}</p></div><span className={`status-chip ${active?'connected':'pending'}`}>{(route.status||'loading').toUpperCase()}</span></div><div className="route-controls"><label className="field-label">TCP provider<select value={provider} onChange={e=>setProviders(old=>({...old,[s.id]:e.target.value}))}><option value="minekube">Minekube Connect</option><option value="bore">Bore</option><option value="pinggy">Pinggy</option></select></label><div className="route-address"><small>Public game address</small><b>{route.address||'Not connected yet'}</b></div><button className="primary-button" disabled={busy===s.id} onClick={()=>run(s,active?'stop':'start')}>{busy===s.id?'Working…':active?'Stop route':'Start route'}</button></div>{route.logs&&<details className="route-logs"><summary>Provider details</summary><pre>{route.logs}</pre></details>}<p className="muted route-help">{provider==='minekube'?'Installs the Minekube Connect plugin. Start/restart the Minecraft server to obtain its public address.':s.state!=='Online'?'Start this server first; this TCP relay waits for its game port to accept connections.':'Starts a temporary TCP relay to this server port.'}</p></section>})}</div>}</>
}

function ConnectorsPage() {
  return <><PageHeading eyebrow="INFRASTRUCTURE / HOSTS" title="OMCP Connectors" description="Securely enroll additional VPS hosts to deploy and manage Minecraft servers."/><div className="routing-warning"><ShieldCheck size={18}/><div><b>Single-host agent is active</b><span>Remote multi-host enrollment is a separate control-plane feature and is not enabled in this build.</span></div><span className="status-chip pending">LOCAL</span></div><section className="panel-card routing-empty"><div className="empty-icon"><Cable size={22}/></div><h2>Your local host is connected</h2><p>This build provisions servers on the machine where OMCP is installed.</p><div className="routing-tags"><span>Loopback API</span><span>Java process control</span><span>Persistent data folder</span></div></section></>
}

function PlaceholderPage({title,icon:Icon,description}:{title:string;icon:typeof Users;description:string}) {
  return <><PageHeading eyebrow={`OMCP / ${title.toUpperCase()}`} title={title} description={description}/><section className="panel-card routing-empty"><div className="empty-icon"><Icon size={22}/></div><h2>Coming in a later build phase</h2><p>This section is not wired to the local agent yet.</p></section></>
}

function CreateServerModal({onClose,onCreate}:{onClose:()=>void;onCreate:(p:CreatePayload)=>Promise<void>}) {
  const [step,setStep]=useState(0),[name,setName]=useState(''),[software,setSoftware]=useState('paper'),[version,setVersion]=useState('1.21.4')
  const [memory,setMemory]=useState('2'),[cpuLimit,setCpuLimit]=useState('0'),[port,setPort]=useState('25565'),[eula,setEula]=useState(false)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const steps=['Game setup','Resources & EULA']
  const submit=async()=>{setBusy(true);setError('');try{await onCreate({name:name.trim(),software,version:version.trim(),memory:Number(memory),cpuLimit:Number(cpuLimit),port:Number(port),eulaAccepted:eula});onClose()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><div className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div className="modal-top"><div><div className="eyebrow">NEW INSTANCE / REAL DEPLOYMENT</div><h2 id="create-title">Create a server</h2><p>OMCP will download the selected server JAR and prepare its files on this host.</p></div><button className="icon-button" onClick={onClose} aria-label="Close" disabled={busy}><X size={19}/></button></div><div className="stepper">{steps.map((s,i)=><button key={s} className={i===step?'step active':i<step?'step complete':'step'} onClick={()=>!busy&&setStep(i)}><span>{i<step?<Check size={13}/>:i+1}</span>{s}</button>)}</div>
    {step===0&&<div className="form-body"><label className="field-label">Server name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Survival SMP" autoFocus maxLength={24}/></label><div className="field-grid"><label className="field-label">Server software<select value={software} onChange={e=>setSoftware(e.target.value)}><option value="paper">Paper</option><option value="purpur">Purpur</option><option value="folia">Folia</option><option value="spigot">Spigot</option><option value="fabric">Fabric</option><option value="vanilla">Vanilla</option><option value="velocity">Velocity proxy</option><option value="waterfall">Waterfall proxy</option></select></label><label className="field-label">Minecraft version<input value={version} onChange={e=>setVersion(e.target.value)} placeholder="1.21.4"/></label></div><div className="info-callout"><FileCode2 size={16}/><span>Supported builds are fetched from the official PaperMC, Purpur, Fabric, Spigot or Mojang download APIs.</span></div></div>}
    {step===1&&<div className="form-body"><div className="field-grid"><label className="field-label">RAM allocation (GB)<input type="number" min="1" value={memory} onChange={e=>setMemory(e.target.value)}/></label><label className="field-label">CPU limit (%)<input type="number" min="0" max="10000" value={cpuLimit} onChange={e=>setCpuLimit(e.target.value)}/></label></div><label className="field-label">Minecraft port<input type="number" min="1024" max="65535" value={port} onChange={e=>setPort(e.target.value)}/></label><label className="toggle-row"><span><b>I accept the Minecraft EULA</b><small>Read the <a href="https://www.minecraft.net/eula" target="_blank" rel="noreferrer">official Minecraft EULA</a> before creating a game server.</small></span><input type="checkbox" checked={eula} onChange={e=>setEula(e.target.checked)}/></label><div className="info-callout"><Cpu size={16}/><span>OMCP validates available host RAM, unique server name and port before downloading the actual server JAR.</span></div></div>}
    {error&&<div className="form-error">{error}</div>}
    <div className="modal-footer"><span className="step-caption">STEP {step+1} OF 2</span><div>{step>0&&<button className="secondary-button" disabled={busy} onClick={()=>setStep(0)}>Back</button>}{step===0?<button className="primary-button" disabled={!name.trim()||!version.trim()} onClick={()=>setStep(1)}>Continue <ArrowRight size={15}/></button>:<button className="primary-button" disabled={busy||!eula||!name.trim()||!Number(memory)||!Number(port)} onClick={submit}><Plus size={15}/>{busy?'Creating server…':'Create real server'}</button>}</div></div>
  </div></div>
}

export default App
