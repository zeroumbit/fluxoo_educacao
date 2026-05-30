import CorujaIcon from '@/assets/coruja_ANDROID.svg'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Globe,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  Menu,
  Server,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  WalletCards,
  X,
  Youtube,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect,useState } from 'react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'Modulos', href: '#modulos' },
  { label: 'Sistema', href: '#sistema' },
  { label: 'Portal dos pais', href: '#portal-pais' },
  { label: 'Seguranca', href: '#seguranca' },
]

const modules = [
  {
    icon: Users,
    title: 'Alunos e matriculas',
    text: 'Cadastro, rematricula, historico, documentos e acompanhamento da jornada escolar.',
  },
  {
    icon: WalletCards,
    title: 'Financeiro escolar',
    text: 'Mensalidades, contas a pagar, relatorios e visao clara da saude financeira.',
  },
  {
    icon: ClipboardCheck,
    title: 'Frequencia e portaria',
    text: 'Rotina de presenca, fila virtual, autorizacoes e controle operacional diario.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda e comunicacao',
    text: 'Eventos, avisos, mural e comunicados que aproximam escola e familia.',
  },
]

const stats = [
  { value: '360o', label: 'visao da escola' },
  { value: '24h', label: 'portal para familias' },
  { value: '1', label: 'base operacional' },
]

const screenshots = {
  home: '/home-web.png',
  reports: '/relatorios.png',
  enrollment: '/matricula-web.png',
  financeMobile: '/financeiro.png',
  studentsMobile: '/grenciar alunos.png',
}

const systemScreens = [
  {
    eyebrow: 'Dashboard da escola',
    title: 'Indicadores em tempo real para decidir com clareza.',
    text: 'A direcao acompanha alunos, mensalidades, alertas ativos e tendencias em uma visao executiva feita para leitura rapida.',
    src: screenshots.home,
    alt: 'Dashboard web do Fluxoo Educacional',
    imageClass: 'scale-[1.16] object-[58%_top]',
    features: ['Visao geral da operacao', 'Alertas e indicadores financeiros', 'Acompanhamento de tendencias'],
  },
  {
    eyebrow: 'Relatorios financeiros',
    title: 'Fechamento mensal organizado por receitas, despesas e saldo.',
    text: 'O financeiro ganha leitura consolidada do fluxo de caixa, com valores recebidos, despesas pagas, saldo atual e previsao.',
    src: screenshots.reports,
    alt: 'Relatorios financeiros do Fluxoo Educacional',
    imageClass: 'scale-[1.06] object-center',
    features: ['Receitas e despesas por competencia', 'Saldo atual e previsto', 'Exportacao para analise'],
  },
  {
    eyebrow: 'Matricula guiada',
    title: 'Cadastro completo sem perder informacoes importantes.',
    text: 'A secretaria conduz a matricula por etapas, reunindo responsavel, dados do aluno, endereco, saude e acesso ao portal.',
    src: screenshots.enrollment,
    alt: 'Fluxo de matricula guiada do Fluxoo Educacional',
    imageClass: 'scale-[1.08] object-center',
    features: ['Etapas claras de preenchimento', 'Dados do responsavel e aluno', 'Base pronta para o portal da familia'],
  },
]

const familyScreens = [
  {
    title: 'Tudo da familia em uma tela simples.',
    text: 'O responsavel acessa alunos vinculados, avisos recentes e atalhos essenciais sem depender de mensagens soltas ou atendimento manual da secretaria.',
    src: '/familia.png',
    alt: 'Tela inicial do portal da familia',
    badge: 'Visao geral',
    features: ['Alunos vinculados ao mesmo responsavel', 'Avisos e atalhos importantes', 'Experiencia pensada para celular'],
  },
  {
    title: 'Cada aluno com acompanhamento individual.',
    text: 'A familia visualiza dados do aluno, situacao escolar e informacoes importantes em uma jornada organizada por perfil.',
    src: '/familia-detalhes-aluno.png',
    alt: 'Detalhes do aluno no portal da familia',
    badge: 'Perfil do aluno',
    features: ['Dados do aluno sempre acessiveis', 'Acompanhamento por estudante', 'Menos duvidas recorrentes para a escola'],
  },
  {
    title: 'Financeiro transparente para pais e secretaria.',
    text: 'Boletos, pagamentos e pendencias ficam claros para o responsavel, reduzindo chamadas repetidas e facilitando a rotina financeira.',
    src: '/familia-financeiro.png',
    alt: 'Financeiro no portal da familia',
    badge: 'Financeiro',
    features: ['Mensalidades e boletos no portal', 'Pendencias visiveis com clareza', 'Mais autonomia para as familias'],
  },
  {
    title: 'Alunos da mesma familia conectados.',
    text: 'O portal mostra os alunos ligados ao responsavel, enquanto a escola ganha base para identificar parentes e sugerir descontos familiares.',
    src: '/familia-alunos.png',
    alt: 'Lista de alunos da familia',
    badge: 'Familia conectada',
    features: ['Identificacao por responsavel', 'Mais clareza para familias com varios alunos', 'Base para descontos sugeridos'],
  },
  {
    title: 'Portaria e chegada com menos friccao.',
    text: 'A familia pode avisar que esta chegando e a escola ganha mais previsibilidade na rotina de entrada, saida e atendimento.',
    src: '/familia-estou-chegando.png',
    alt: 'Tela estou chegando do portal da familia',
    badge: 'Estou chegando',
    features: ['Aviso rapido para a escola', 'Rotina de portaria mais organizada', 'Melhor experiencia para responsaveis'],
  },
]

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Fluxoo Educacao">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ${inverted ? 'bg-white shadow-white/10' : 'bg-zinc-950 shadow-zinc-950/15'}`}>
        <img src={CorujaIcon} alt="" className="h-6 w-6" />
      </span>
      <span className="leading-tight">
        <strong className={`block text-base font-black ${inverted ? 'text-white' : 'text-zinc-950'}`}>Fluxoo</strong>
        <span className={`block text-xs font-semibold uppercase tracking-[0.18em] ${inverted ? 'text-zinc-400' : 'text-zinc-500'}`}>Educacao</span>
      </span>
    </Link>
  )
}

function WebMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative rounded-[1.75rem] border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-950/15"
    >
      <div className="flex h-8 items-center gap-2 rounded-t-2xl border-b border-zinc-100 bg-zinc-50 px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-4 h-3 w-40 rounded-full bg-zinc-200" />
      </div>
      <div className="overflow-hidden rounded-b-2xl bg-zinc-50">
        <img
          src={screenshots.home}
          alt="Dashboard web do Fluxoo Educacional"
          className="aspect-[16/10] w-full object-cover object-center"
        />
      </div>
      <div className="absolute -right-6 top-16 hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-950/10 md:block">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-zinc-800">Matricula aprovada</span>
        </div>
      </div>
    </motion.div>
  )
}

function PhoneMockup({ screen }: { screen: (typeof familyScreens)[number] }) {
  return (
    <div className="relative mx-auto flex min-h-[560px] w-full max-w-[420px] items-center justify-center">
      <motion.div
        key={screen.src}
        initial={{ opacity: 0, x: 24, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1, y: [0, -8, 0] }}
        exit={{ opacity: 0, x: -24, scale: 0.96 }}
        transition={{ opacity: { duration: 0.35 }, x: { duration: 0.35 }, scale: { duration: 0.35 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
        className="relative w-[260px] overflow-hidden rounded-[2.2rem] border-[8px] border-zinc-950 bg-white shadow-2xl shadow-zinc-950/25 sm:w-[285px]"
      >
        <img src={screen.src} alt={screen.alt} className="w-full object-cover" />
      </motion.div>
    </div>
  )
}

function ScreenshotSlot({
  label,
  caption,
  src,
  className = '',
}: {
  label: string
  caption: string
  src: string
  className?: string
}) {
  return (
    <div className={`group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card-sm transition-all hover:-translate-y-1 hover:shadow-card-lg ${className}`}>
      <div className="relative overflow-hidden bg-zinc-100">
        <img src={src} alt={label} className="h-full w-full object-cover object-left-top transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950/45 to-transparent" />
      </div>
      <div className="p-5">
        <div className="text-sm font-black text-zinc-950">{label}</div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{caption}</p>
      </div>
    </div>
  )
}

function DesktopMockup({ screen }: { screen: (typeof systemScreens)[number] }) {
  return (
    <div className="relative">
      <motion.div
        key={screen.src}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="rounded-[1.75rem] border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-950/10"
      >
        <div className="flex h-8 items-center gap-2 rounded-t-2xl border-b border-zinc-100 bg-zinc-50 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-4 h-3 w-44 rounded-full bg-zinc-200" />
        </div>
        <div className="overflow-hidden rounded-b-2xl bg-zinc-50">
          <img
            src={screen.src}
            alt={screen.alt}
            className={`aspect-[16/10] w-full object-cover transition-transform duration-700 ${screen.imageClass}`}
          />
        </div>
      </motion.div>
    </div>
  )
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSystemScreen, setActiveSystemScreen] = useState(0)
  const [activeFamilyScreen, setActiveFamilyScreen] = useState(0)
  const systemScreen = systemScreens[activeSystemScreen]
  const familyScreen = familyScreens[activeFamilyScreen]
  const trustItems = [
    { icon: Lock, title: 'Login por perfil', text: 'Acesso separado para escola, professores, pais e administracao.' },
    { icon: Smartphone, title: 'Web e mobile', text: 'Layout responsivo para decisores no desktop e familias no celular.' },
    { icon: BarChart3, title: 'Indicadores', text: 'Dados de operacao, financeiro e alunos em uma leitura objetiva.' },
  ]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveFamilyScreen((current) => (current + 1) % familyScreens.length)
    }, 4200)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSystemScreen((current) => (current + 1) % systemScreens.length)
    }, 4600)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-bold text-zinc-600 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-zinc-950">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Button asChild variant="outline" className="rounded-xl border-zinc-300 bg-white">
              <Link to="/login">
                <Lock className="h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-zinc-950 shadow-lg shadow-zinc-950/15 hover:bg-zinc-800">
              <Link to="/cadastro">
                Solicitar demonstracao
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Abrir menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-zinc-200 bg-slate-50 px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="rounded-xl bg-white px-4 py-3 text-sm font-bold">
                  {item.label}
                </a>
              ))}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button asChild variant="outline" className="rounded-xl bg-white">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="rounded-xl bg-zinc-950">
                  <Link to="/cadastro">Solicitar demonstracao</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-20">
        <section id="sistema" className="relative overflow-hidden px-4 pt-16 pb-0 sm:px-6 lg:px-8 lg:pt-20 lg:pb-0">
          <div className="absolute left-8 top-28 hidden h-24 w-24 rounded-[2rem] bg-blue-100 lg:block motion-safe:animate-pulse" />
          <div className="absolute right-10 top-36 hidden h-28 w-28 rounded-full bg-indigo-200/60 lg:block" />
          <div className="mx-auto grid max-w-7xl items-center gap-x-12 gap-y-8 lg:grid-cols-[0.88fr_1.12fr]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-600 shadow-card-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Gestao escolar integrada
              </div>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
                A escola no controle. Os pais sempre por perto.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
                Fluxoo Educacao organiza matriculas, alunos, financeiro, frequencia, comunicacao e portal da familia em
                uma unica operacao digital para escolas que precisam crescer sem perder clareza.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-xl bg-zinc-950 px-6 shadow-xl shadow-zinc-950/20 hover:bg-zinc-800">
                  <Link to="/cadastro">
                    Solicitar demonstracao
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-zinc-300 bg-white px-6">
                  <a href="#portal-pais">
                    Ver portal dos pais
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </motion.div>
            <div className="relative flex items-center lg:-translate-y-6">
              <WebMockup />
              <div className="absolute -bottom-8 -left-6 hidden w-56 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-950/10 md:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black">Mesma familia</div>
                    <div className="text-xs text-zinc-500">parentes detectados</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card-md sm:grid-cols-3 lg:col-span-2">
              {stats.map((stat) => (
                <div key={stat.label} className="border-b border-zinc-100 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <div className="text-2xl font-black text-zinc-950">{stat.value}</div>
                  <div className="mt-1 text-xs font-semibold text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 rounded-[1.75rem] bg-zinc-950 p-4 text-white shadow-2xl shadow-zinc-950/15 md:grid-cols-3">
            {[
              ['Para direcao', 'Indicadores, operacao e decisoes em tempo real.'],
              ['Para secretaria', 'Matriculas, documentos e cadastros com menos retrabalho.'],
              ['Para familia', 'Portal simples para acompanhar a vida escolar.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-950">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="modulos" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-700">O que o sistema resolve</p>
                <h2 className="mt-4 text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
                  Uma base unica para a rotina inteira da escola.
                </h2>
                <p className="mt-5 text-base leading-7 text-zinc-600">
                  O Fluxoo conecta secretaria, financeiro, pedagogico e comunicacao em uma rotina mais clara para a
                  equipe escolar. A escola acompanha cada setor, reduz retrabalho e entrega uma experiencia melhor para
                  as familias.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map((item, index) => (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card-sm transition-all hover:-translate-y-1 hover:shadow-card-lg"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-zinc-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">{item.text}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="lg:pr-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-700">Sistema otimizado</p>
                <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
                  Um sistema ajustado ao dia-dia da escola.
                </h2>
                <p className="mt-5 max-w-md text-left text-base leading-7 text-zinc-600">
                  Indicadores em tempo real que potencializam sua administracao escolar.
                </p>

                <motion.div
                  key={systemScreen.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="mt-14"
                >
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-700">{systemScreen.eyebrow}</p>
                  <h3 className="mt-3 max-w-lg text-xl font-black leading-tight text-zinc-950">{systemScreen.title}</h3>
                  <p className="mt-3 max-w-lg text-base leading-6 text-zinc-600">{systemScreen.text}</p>
                </motion.div>
              </div>
              <DesktopMockup screen={systemScreen} />
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {systemScreen.features.map((feature) => (
                <div key={feature} className="flex items-center gap-4 rounded-lg bg-indigo-50 p-5">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-indigo-600" />
                  <span className="text-base font-black text-zinc-950">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex justify-center gap-2">
              {systemScreens.map((screen, index) => (
                <button
                  key={screen.src}
                  type="button"
                  onClick={() => setActiveSystemScreen(index)}
                  className={`h-3 rounded-full transition-all ${index === activeSystemScreen ? 'w-14 bg-indigo-600' : 'w-3 bg-zinc-300 hover:bg-zinc-400'}`}
                  aria-label={`Mostrar ${screen.eyebrow}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="portal-pais" className="overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 rounded-[2rem] bg-white p-6 shadow-2xl shadow-zinc-950/10 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
            <div className="relative order-2 lg:order-1">
              <PhoneMockup screen={familyScreen} />
              <div className="absolute left-0 top-10 hidden rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-xl shadow-emerald-900/20 md:block">
                {familyScreen.badge}
              </div>
              <div className="absolute bottom-12 right-6 hidden rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-xl shadow-indigo-900/20 md:block motion-safe:animate-pulse">
                Pais conectados
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-700">Portal dos pais</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
                {familyScreen.title}
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-600">
                {familyScreen.text}
              </p>
              <div className="mt-7 space-y-3">
                {familyScreen.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="text-sm font-bold text-zinc-800">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                {familyScreens.map((screen, index) => (
                  <button
                    key={screen.src}
                    type="button"
                    onClick={() => setActiveFamilyScreen(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeFamilyScreen ? 'w-10 bg-indigo-600' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'}`}
                    aria-label={`Mostrar ${screen.badge}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="seguranca" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[2rem] bg-zinc-950 p-8 text-white shadow-2xl shadow-zinc-950/15 lg:p-10">
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
              <h2 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
                Gestao com seguranca, perfis e rastreabilidade.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                O discurso da landing acompanha o produto: permissao por perfil, modulos protegidos, auditoria e
                experiencias separadas para gestor, professor, familia e super admin.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {trustItems.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card-sm">
                  <Icon className="h-6 w-6 text-indigo-600" />
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-900/20">
            <div className="grid items-center gap-6 p-8 lg:grid-cols-[1fr_auto] lg:p-10">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-100">Proximo passo</p>
                <h2 className="mt-3 text-4xl font-black leading-tight text-white">
                  Veja o Fluxoo aplicado na rotina da sua escola.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-indigo-50">
                  A demonstracao pode focar em secretaria, gestao financeira, rotina academica ou portal dos pais. O
                  sistema tambem detecta alunos de um mesmo responsavel e sugere descontos para familias.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" className="h-12 rounded-xl bg-zinc-950 px-6 hover:bg-zinc-800">
                  <Link to="/cadastro">
                    Solicitar demonstracao
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-zinc-950 bg-white px-6">
                  <Link to="/login">Entrar no sistema</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-16 text-zinc-400 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">

            {/* Coluna 1 — Ecossistema ZERO1BIT */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Ecossistema ZERO1BIT</h3>
              <ul className="space-y-3">
                <li><a href="/sobre" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Sobre a ZERO1BIT <ExternalLink className="h-3 w-3" /></a></li>
                <li>
                  <span className="text-sm font-medium text-zinc-500">Nossas Startups</span>
                  <ul className="mt-2 space-y-2 ml-4">
                    <li><a href="https://www.temrango.com.br/" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Temrango <ExternalLink className="h-3 w-3" /></a></li>
                    <li><a href="https://www.pescaprecos.com.br/" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Pescaprecos <ExternalLink className="h-3 w-3" /></a></li>
                    <li><a href="https://doc.fluxoo.com.br/login" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Fluxoo Doc <ExternalLink className="h-3 w-3" /></a></li>
                    <li><span className="text-sm text-zinc-500">Fluxoo Legisla</span></li>
                    <li><span className="text-sm text-zinc-500">Fluxoo Edu</span></li>
                    <li><a href="#" className="text-sm hover:text-white transition-colors">Essencial PDV</a></li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Coluna 2 — Soluções */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Soluções</h3>
              <ul className="space-y-3">
                <li><a href="/desenvolvimento" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Desenvolvimento de Software & Apps <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="/consultoria" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Consultoria & CTO as a Service <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="/transformacao-digital" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Transformação Digital para Gestão Pública <ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>

            {/* Coluna 3 — Contato e Legal */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Contato e Legal</h3>
              <ul className="space-y-3">
                <li><a href="mailto:zero1bit@gmail.com" className="text-sm hover:text-white transition-colors inline-flex items-center gap-2"><Mail className="h-4 w-4" /> zero1bit@gmail.com</a></li>
                <li><span className="text-sm inline-flex items-center gap-2"><Building2 className="h-4 w-4" /> Sede: Canindé/CE — Paulino Barroso, 777</span></li>
                <li className="pt-2 border-t border-zinc-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Fluxoo Edu</span>
                  <ul className="mt-2 space-y-2">
                    <li><a href="/politica-privacidade" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Política de Privacidade <ExternalLink className="h-3 w-3" /></a></li>
                    <li><a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Termos de Uso <ExternalLink className="h-3 w-3" /></a></li>
                    <li><a href="/politica-privacidade" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors inline-flex items-center gap-1">Segurança e Conformidade <ExternalLink className="h-3 w-3" /></a></li>
                  </ul>
                </li>
              </ul>
            </div>

          </div>

          {/* Badges + Redes + Copyright */}
          <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400"><ShieldCheck className="h-3 w-3" /> LGPD Ready</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-800 bg-blue-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400"><Lock className="h-3 w-3" /> SSL</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-800 bg-cyan-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400"><Server className="h-3 w-3" /> Cloud Backup</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} ZERO1BIT Venture Builder. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
