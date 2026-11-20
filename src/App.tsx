import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, Bell, Blocks, Cable,
  Check, ChevronDown, ChevronRight, CircleHelp, Cpu, FileCode2,
  Globe2, HardDrive, LayoutDashboard, LifeBuoy, LockKeyhole, Menu, MoreHorizontal,
  Network, Plus, RadioTower, Search, Server, Settings2, ShieldCheck, Sparkles,
  Users, Wifi, X, Zap,
} from 'lucide-react'

type Page = 'Overview' | 'Servers' | 'Routing' | 'Connectors' | 'Users' | 'Extensions' | 'Settings'
type ServerItem = { name: string; game: string; address: string; state: 'Online' | 'Starting' | 'Offline'; cpu: number; ram: string; accent: string }

const initialServers: ServerItem[] = [
  { name: 'Survival SMP', game: 'Paper · 1.21.4', address: 'play.onioncraft.net:25565', state: 'Online', cpu: 34, ram: '3.2 / 6 GB', accent: 'lime' },
  { name: 'Skyblock Realm', game: 'Purpur · 1.21.1', address: 'sky.onioncraft.net:25566', state: 'Online', cpu: 18, ram: '2.1 / 4 GB', accent: 'violet' },
  { name: 'Modded Origins', game: 'Fabric · 1.20.1', address: 'modded.onioncraft.net:25567', state: 'Starting', cpu: 0, ram: '—', accent: 'orange' },
]

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
  const [servers, setServers] = useState(initialServers)
  const [createOpen, setCreateOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const filteredServers = useMemo(() => servers.filter(s => s.name.toLowerCase().includes(search.toLowerCase())), [servers, search])
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200) }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span>O</span><i /></div>
          <div><div className="brand-name">OMCP<span>.</span></div><div className="brand-caption">ONION CONTROL PLANE</div></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={17}/></button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-avatar">OC</div>
          <div className="workspace-copy"><b>OnionCraft</b><span>Personal workspace</span></div>
          <ChevronDown size={15} className="muted-icon"/>
        </div>
        <nav className="main-nav">
          {['WORKSPACE', 'INFRASTRUCTURE', 'MANAGEMENT', 'SYSTEM'].map(group => (
            <div className="nav-group" key={group}>
              <div className="nav-label">{group}</div>
              {navItems.filter(item => item.group === group).map(item => {
                const Icon = item.icon
                return <button key={item.label} className={`nav-link ${page === item.label ? 'active' : ''}`} onClick={() => { setPage(item.label); setMobileNav(false) }}>
                  <Icon size={17}/><span>{item.label}</span>{item.label === 'Routing' && <span className="nav-live-dot"/>}
                  {item.label === 'Servers' && <small>{servers.length}</small>}
                </button>
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-icon"><Sparkles size={15}/></div>
            <div><b>OMCP Core</b><span>Infrastructure status</span></div>
            <span className="tiny-online">●</span>
            <div className="plan-meter"><i/></div>
            <small>Control plane initialized</small>
          </div>
          <button className="nav-link"><LifeBuoy size={17}/><span>Documentation</span><ArrowUpRight size={13} className="end-icon"/></button>
          <div className="profile-row"><div className="profile-avatar">O</div><div className="profile-copy"><b>Administrator</b><span>Owner account</span></div><MoreHorizontal size={18} className="muted-icon"/></div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19}/></button><div className="breadcrumb">Workspace <ChevronRight size={13}/> <b>{page}</b></div></div>
          <div className="topbar-actions">
            <div className="system-pill"><span/>All systems nominal</div>
            <button className="icon-button" aria-label="Help"><CircleHelp size={17}/></button>
            <button className="icon-button notification-button" onClick={() => notify('You are all caught up.')} aria-label="Notifications"><Bell size={17}/><i/></button>
            <div className="top-avatar">O</div>
          </div>
        </header>

        <div className="page-content">
          {page === 'Overview' && <Overview servers={servers} onCreate={() => setCreateOpen(true)} onNavigate={setPage} />}
          {page === 'Servers' && <ServersPage servers={filteredServers} search={search} setSearch={setSearch} onCreate={() => setCreateOpen(true)} />}
          {page === 'Routing' && <RoutingPage />}
          {page === 'Connectors' && <ConnectorsPage />}
          {page === 'Users' && <PlaceholderPage title="Users & access" icon={Users} description="Manage panel accounts, roles and server-level permissions." />}
          {page === 'Extensions' && <PlaceholderPage title="Extensions" icon={Blocks} description="Extend OMCP with reviewed integrations and automation." />}
          {page === 'Settings' && <PlaceholderPage title="System settings" icon={Settings2} description="Configure panel identity, security and platform preferences." />}
          <footer className="page-footer"><span>OMCP Panel <b>v0.1.0 · Early access</b></span><span><i/> Control plane UI ready <span className="footer-sep">·</span> Built for your infrastructure</span></footer>
        </div>
      </main>

      {createOpen && <CreateServerModal onClose={() => setCreateOpen(false)} onCreate={(server) => { setServers(current => [server, ...current]); setCreateOpen(false); setPage('Servers'); notify('Server added to the local panel preview.') }} />}
      {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Overview({ servers, onCreate, onNavigate }: { servers: ServerItem[]; onCreate: () => void; onNavigate: (page: Page) => void }) {
  return <>
    <PageHeading eyebrow="CONTROL CENTER / OVERVIEW" title="Good evening, Admin." description="Here's what's happening across your Minecraft infrastructure." action={<button className="primary-button" onClick={onCreate}><Plus size={16}/> Create server</button>}/>
    <div className="welcome-strip"><div className="welcome-glow"/><div className="welcome-icon"><Zap size={19}/></div><div className="welcome-copy"><b>Your infrastructure, one command away.</b><span>Connect a host, deploy a server, and let OMCP handle the routing.</span></div><button onClick={() => onNavigate('Connectors')}>Explore connectors <ArrowRight size={15}/></button><div className="strip-orbit orbit-one"/><div className="strip-orbit orbit-two"/></div>
    <div className="section-row"><div><div className="section-title">Infrastructure at a glance</div><div className="section-subtitle">Live resource overview <span className="live-label"><i/> PREVIEW DATA</span></div></div><button className="subtle-button" onClick={() => onNavigate('Connectors')}>View infrastructure <ArrowUpRight size={14}/></button></div>
    <div className="stats-grid">
      <StatCard icon={Server} label="Total servers" value={String(servers.length).padStart(2, '0')} meta="Across all connectors" tone="green" chart={[25,38,31,52,42,66,54,72,63,85,69,92]}/>
      <StatCard icon={Activity} label="Online servers" value={String(servers.filter(s => s.state === 'Online').length).padStart(2, '0')} meta="Current panel preview" tone="blue" chart={[42,36,48,44,58,52,69,61,73,68,84,78]}/>
      <StatCard icon={Cpu} label="CPU allocation" value="52%" meta="Illustrative dashboard value" tone="purple" chart={[30,40,35,58,49,61,55,70,65,77,68,83]}/>
      <StatCard icon={HardDrive} label="Memory allocated" value="5.3 GB" meta="Illustrative dashboard value" tone="orange" chart={[20,32,28,45,39,51,47,60,54,68,62,76]}/>
    </div>
    <div className="content-grid">
      <section className="panel-card servers-panel">
        <div className="panel-heading"><div><h2>Recent servers</h2><p>Your latest server instances</p></div><button className="text-button" onClick={() => onNavigate('Servers')}>View all <ArrowRight size={14}/></button></div>
        <div className="server-list">{servers.slice(0, 3).map(server => <ServerRow key={server.name} server={server}/>)}</div>
        <button className="add-server-row" onClick={onCreate}><span><Plus size={16}/></span> Create another server</button>
      </section>
      <section className="panel-card network-panel">
        <div className="panel-heading"><div><h2>Network overview</h2><p>Routing layer status</p></div><span className="status-chip pending">NOT CONNECTED</span></div>
        <div className="network-visual"><div className="network-ring ring-a"/><div className="network-ring ring-b"/><div className="network-center"><Globe2 size={25}/><span>OMCP</span></div><div className="network-node node-top"><RadioTower size={14}/></div><div className="network-node node-left"><Server size={14}/></div><div className="network-node node-right"><Network size={14}/></div></div>
        <div className="network-foot"><div><span className="foot-dot amber"/> Routing gateway <b>Not configured</b></div><button onClick={() => onNavigate('Routing')}>Configure <ArrowRight size={13}/></button></div>
      </section>
    </div>
    <div className="bottom-grid">
      <section className="panel-card activity-panel"><div className="panel-heading"><div><h2>Activity feed</h2><p>Recent control-plane events</p></div><button className="icon-button"><MoreHorizontal size={17}/></button></div><div className="empty-activity"><div className="empty-icon"><Activity size={19}/></div><b>No activity yet</b><span>Events from connected services will appear here.</span></div></section>
      <section className="panel-card quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Common infrastructure tasks</p></div></div><div className="quick-actions"><button onClick={() => onNavigate('Connectors')}><span className="quick-icon purple"><Cable size={17}/></span><span><b>Connect a host</b><small>Register an OMCP Connector</small></span><ChevronRight size={16}/></button><button onClick={() => onNavigate('Routing')}><span className="quick-icon blue"><Network size={17}/></span><span><b>Set up routing</b><small>Configure public endpoints</small></span><ChevronRight size={16}/></button><button onClick={onCreate}><span className="quick-icon green"><Plus size={17}/></span><span><b>Deploy a server</b><small>Create a Minecraft instance</small></span><ChevronRight size={16}/></button></div></section>
    </div>
  </>
}

function StatCard({ icon: Icon, label, value, meta, tone, chart }: { icon: typeof Server; label: string; value: string; meta: string; tone: string; chart: number[] }) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}><Icon size={17}/></span><span className="stat-period">LAST 12 POINTS</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-bottom"><span>{meta}</span><div className="mini-chart">{chart.map((n, i) => <i key={i} style={{ height: `${n}%` }}/>)}</div></div></div>
}

function ServerRow({ server }: { server: ServerItem }) {
  return <div className="server-row"><div className={`game-icon ${server.accent}`}><span>{server.game.startsWith('Paper') ? 'P' : server.game.startsWith('Purpur') ? '✦' : 'F'}</span></div><div className="server-info"><b>{server.name}</b><span>{server.game}</span></div><div className="server-address"><Globe2 size={12}/>{server.address}</div><div className={`server-state ${server.state.toLowerCase()}`}><i/>{server.state}</div><button className="icon-button row-more" aria-label={`More about ${server.name}`}><MoreHorizontal size={17}/></button></div>
}

function ServersPage({ servers, search, setSearch, onCreate }: { servers: ServerItem[]; search: string; setSearch: (v: string) => void; onCreate: () => void }) {
  return <><PageHeading eyebrow="WORKSPACE / SERVERS" title="Your servers" description="Manage game instances, resources and server access." action={<button className="primary-button" onClick={onCreate}><Plus size={16}/> Create server</button>}/><div className="toolbar"><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search servers..."/></div><button className="filter-button"><span/> All statuses <ChevronDown size={14}/></button></div><section className="panel-card full-table"><div className="table-head"><span>SERVER</span><span>ADDRESS</span><span>STATUS</span><span>CPU</span><span>MEMORY</span><span/></div>{servers.map(s => <div className="table-row" key={s.name}><div className="table-server"><div className={`game-icon ${s.accent}`}>{s.game.startsWith('Paper') ? 'P' : s.game.startsWith('Purpur') ? '✦' : 'F'}</div><div><b>{s.name}</b><small>{s.game}</small></div></div><span className="table-address">{s.address}</span><span className={`server-state ${s.state.toLowerCase()}`}><i/>{s.state}</span><span>{s.cpu ? `${s.cpu}%` : '—'}</span><span>{s.ram}</span><button className="icon-button"><MoreHorizontal size={17}/></button></div>)}{servers.length === 0 && <div className="empty-activity"><b>No matching servers</b><span>Try another search or create a new server.</span></div>}</section></>
}

function RoutingPage() {
  return <><PageHeading eyebrow="INFRASTRUCTURE / NETWORK" title="Routing & tunnels" description="Manage public endpoints, shared IP allocations and secure Connector tunnels." action={<button className="primary-button" onClick={() => alert('Routing gateway setup will be available after the routing service is implemented.')}><Plus size={16}/> Add endpoint</button>}/><div className="routing-warning"><LockKeyhole size={18}/><div><b>Routing engine is not connected</b><span>This is the configuration UI foundation. No public ports are allocated and no traffic is being proxied yet.</span></div><span className="status-chip pending">OFFLINE</span></div><div className="stats-grid routing-stats"><StatCard icon={Globe2} label="Public endpoints" value="00" meta="No gateways registered" tone="blue" chart={[10,10,10,10,10,10,10,10,10,10,10,10]}/><StatCard icon={Cable} label="Allocated ports" value="00" meta="No allocations yet" tone="purple" chart={[10,10,10,10,10,10,10,10,10,10,10,10]}/><StatCard icon={Wifi} label="Active tunnels" value="00" meta="Waiting for Connector" tone="green" chart={[10,10,10,10,10,10,10,10,10,10,10,10]}/><StatCard icon={ShieldCheck} label="Tunnel security" value="—" meta="Not initialized" tone="orange" chart={[10,10,10,10,10,10,10,10,10,10,10,10]}/></div><section className="panel-card routing-empty"><div className="empty-icon"><Network size={22}/></div><h2>No routing endpoints configured</h2><p>Add a gateway with a reachable public IPv4 or IPv6 address. Private-only and IPv6-only hosts can use a public relay through an authenticated outbound tunnel.</p><div className="routing-tags"><span>IPv4 relay</span><span>IPv6 native</span><span>Dual stack</span><span>TCP proxy</span></div></section></>
}

function ConnectorsPage() {
  return <><PageHeading eyebrow="INFRASTRUCTURE / HOSTS" title="OMCP Connectors" description="Securely enroll VPS hosts to deploy and manage Minecraft servers." action={<button className="primary-button" onClick={() => alert('Connector enrollment will be enabled with the API service.')}><Plus size={16}/> Enroll connector</button>}/><div className="routing-warning"><ShieldCheck size={18}/><div><b>No connectors enrolled</b><span>Connector enrollment and host operations become available after the API and Connector services are implemented.</span></div><span className="status-chip pending">0 CONNECTED</span></div><section className="panel-card routing-empty"><div className="empty-icon"><Cable size={22}/></div><h2>Your infrastructure starts here</h2><p>Each Connector will securely report host capacity, IPv4/IPv6 capability, server inventory and health. OMCP will not expose arbitrary shell access to panel users.</p><div className="routing-tags"><span>Outbound TLS</span><span>Host telemetry</span><span>Scoped commands</span></div></section></>
}

function PlaceholderPage({ title, icon: Icon, description }: { title: string; icon: typeof Users; description: string }) {
  return <><PageHeading eyebrow={`OMCP / ${title.toUpperCase()}`} title={title} description={description}/><section className="panel-card routing-empty"><div className="empty-icon"><Icon size={22}/></div><h2>Coming in the next build phase</h2><p>This section is part of the OMCP product structure. Its backend workflows and permission checks have not been implemented yet.</p></section></>
}

function CreateServerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (server: ServerItem) => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [software, setSoftware] = useState('Paper')
  const [version, setVersion] = useState('1.21.4')
  const [connector, setConnector] = useState('auto')
  const [ipMode, setIpMode] = useState('shared')
  const [routeMode, setRouteMode] = useState('tunnel')
  const [port, setPort] = useState('25565')
  const [tunnel, setTunnel] = useState(true)
  const steps = ['Game setup', 'Host & resources', 'Network & routing']
  const submit = () => onCreate({ name: name.trim(), game: `${software} · ${version}`, address: ipMode === 'shared' ? `play.example.net:${port}` : `pending:${port}`, state: 'Offline', cpu: 0, ram: '0 / 4 GB', accent: 'lime' })
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div className="modal-top"><div><div className="eyebrow">NEW INSTANCE / CONFIGURATION</div><h2 id="create-title">Create a server</h2><p>Configure your game, host and public network route.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button></div><div className="stepper">{steps.map((s, i) => <button key={s} className={i === step ? 'step active' : i < step ? 'step complete' : 'step'} onClick={() => setStep(i)}><span>{i < step ? <Check size={13}/> : i + 1}</span>{s}</button>)}</div>
    {step === 0 && <div className="form-body"><label className="field-label">Server name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Survival SMP" autoFocus/></label><div className="field-grid"><label className="field-label">Server software<select value={software} onChange={e => setSoftware(e.target.value)}><option>Paper</option><option>Vanilla</option><option>Purpur</option><option>Fabric</option><option>Forge</option><option>NeoForge</option></select></label><label className="field-label">Game version<select value={version} onChange={e => setVersion(e.target.value)}><option>1.21.4</option><option>1.21.1</option><option>1.20.1</option><option>1.20.4</option><option>1.19.4</option></select></label></div><div className="info-callout"><FileCode2 size={16}/><span>Software downloads and checksum verification will be handled by the OMCP API during deployment.</span></div></div>}
    {step === 1 && <div className="form-body"><label className="field-label">OMCP Connector<select value={connector} onChange={e => setConnector(e.target.value)}><option value="auto">Automatic (best available)</option><option value="none">No connector enrolled yet</option></select></label><div className="field-grid"><label className="field-label">Memory allocation<select><option>4 GB</option><option>2 GB</option><option>6 GB</option><option>8 GB</option><option>12 GB</option></select></label><label className="field-label">CPU limit<select><option>200% (2 cores)</option><option>100% (1 core)</option><option>300% (3 cores)</option><option>400% (4 cores)</option></select></label></div><label className="field-label">Disk allocation<select><option>20 GB</option><option>10 GB</option><option>40 GB</option><option>80 GB</option></select></label><div className="info-callout"><Cpu size={16}/><span>Capacity will be validated against live Connector telemetry before any server is created.</span></div></div>}
    {step === 2 && <div className="form-body"><div className="network-section-title"><Globe2 size={16}/> Public address strategy</div><div className="choice-grid"><button className={ipMode === 'shared' ? 'choice-card selected' : 'choice-card'} onClick={() => setIpMode('shared')}><span className="choice-check">{ipMode === 'shared' && <Check size={12}/>}</span><b>Shared IP + port</b><small>Route through an OMCP public gateway. Ideal for private or IPv6-only VPS hosts.</small><em>RECOMMENDED</em></button><button className={ipMode === 'dedicated' ? 'choice-card selected' : 'choice-card'} onClick={() => setIpMode('dedicated')}><span className="choice-check">{ipMode === 'dedicated' && <Check size={12}/>}</span><b>Dedicated IP</b><small>Use a directly reachable public address assigned to the Connector host.</small></button></div><div className="field-grid"><label className="field-label">Routing mode<select value={routeMode} onChange={e => setRouteMode(e.target.value)}><option value="tunnel">Authenticated tunnel</option><option value="direct">Direct public route</option></select></label><label className="field-label">Public port<input value={port} onChange={e => setPort(e.target.value)} inputMode="numeric" placeholder="25565"/></label></div><label className="toggle-row"><span><b>Enable secure Connector tunnel</b><small>Encrypted outbound tunnel with scoped route registration.</small></span><input type="checkbox" checked={tunnel} onChange={e => setTunnel(e.target.checked)}/></label><div className="info-callout"><LockKeyhole size={16}/><span>Routing is a planned integration. No port is reserved and no tunnel is established by this UI preview.</span></div></div>}
    <div className="modal-footer"><span className="step-caption">STEP {step + 1} OF 3</span><div>{step > 0 && <button className="secondary-button" onClick={() => setStep(step - 1)}>Back</button>}{step < 2 ? <button className="primary-button" disabled={step === 0 && !name.trim()} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={15}/></button> : <button className="primary-button" disabled={!name.trim() || !port.trim()} onClick={submit}><Plus size={15}/> Create preview</button>}</div></div>
  </div></div>
}

export default App
