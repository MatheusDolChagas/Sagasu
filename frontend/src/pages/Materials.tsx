import { Link } from 'react-router-dom';
import {
  HiAcademicCap,
  HiHeart,
  HiPhone,
  HiShieldCheck,
  HiUserGroup,
  HiMapPin,
} from 'react-icons/hi2';

const sections = [
  {
    icon: HiHeart,
    title: 'Primeiros passos quando alguém desaparece',
    items: [
      'Mantenha a calma e acione imediatamente a polícia (190) ou delegacia mais próxima.',
      'Reúna documento com foto recente, descrição física, roupas usadas e informações médicas.',
      'Verifique círculos seguros: vizinhos, comércio local, praças e rotas habituais da pessoa.',
      'Cadastre o caso no Sagasu com local e data do último avistamento para ampliar a rede de divulgação.',
    ],
  },
  {
    icon: HiUserGroup,
    title: 'Como a comunidade pode ajudar',
    items: [
      'Compartilhe apenas informações oficiais ou confirmadas pela família/autoridades.',
      'Registre avistamentos com foto e localização no mapa quando possível — dados precisos salvam tempo.',
      'Respeite a privacidade da família e evite especulação ou conteúdo sensacionalista.',
      'Participe de grupos de busca coordenados na plataforma para não duplicar esforços.',
    ],
  },
  {
    icon: HiMapPin,
    title: 'Uso responsável do mapa e das mídias',
    items: [
      'Fotos devem ser adequadas ao contexto de busca (rosto, vestimentas, ambiente).',
      'O sistema pode recusar imagens fora do padrão com validação automática quando a IA estiver configurada.',
      'O mapa de calor mostra concentração de ocorrências por região — use para entender padrões, não para expor endereços específicos sem necessidade.',
    ],
  },
  {
    icon: HiShieldCheck,
    title: 'Alzheimer e pessoas com deficiência cognitiva',
    items: [
      'Muitos deslocamentos são repetitivos: anote horários, lugares favoritos e gatilhos emocionais.',
      'Identificação visível (pulseira, cartão no bolso) e cadastro em serviços de apoio reduzem risco.',
      'Evite confronto ao reencontrar a pessoa: acolha com segurança e procure avaliação médica se necessário.',
    ],
  },
  {
    icon: HiPhone,
    title: 'Emergência e apoio no Brasil',
    items: [
      '190 — Polícia Militar (emergência).',
      '197 — Polícia Civil (registro de ocorrência, conforme orientação local).',
      '192 — SAMU (urgência médica).',
      'Disque 100 — Direitos humanos / situações de vulnerabilidade.',
      'Em cada estado há números de defensorias e CVV (188 — apoio emocional, 24h).',
    ],
  },
];

export default function Materials() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-dark via-dark/95 to-primary/25 text-white py-16 px-4">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
        </div>
        <div className="relative container mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary/90 mb-3">
            Educação e prevenção
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex flex-wrap items-center justify-center gap-3">
            <HiAcademicCap className="w-12 h-12 text-primary shrink-0" aria-hidden />
            Materiais educativos
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Orientações práticas para familiares, voluntários e comunidade no contexto de idosos
            desaparecidos. Este conteúdo é informativo e não substitui orientação policial ou médica.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm mb-10">
          <h2 className="text-xl font-bold text-dark mb-3">Sobre este espaço</h2>
          <p className="text-dark/90 leading-relaxed">
            O Sagasu integra casos, mapa, avistamentos e notificações. Estes materiais reforçam boas
            práticas de divulgação, privacidade e segurança — inclusive a validação automática de
            imagens em fotos de perfil e casos, quando disponível no servidor.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map(({ icon: Icon, title, items }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm scroll-mt-24"
            >
              <div className="flex gap-4 mb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/25 text-dark">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-dark pt-1">{title}</h2>
              </div>
              <ul className="space-y-3 list-disc pl-5 text-dark/90 marker:text-primary">
                {items.map((text) => (
                  <li key={text} className="leading-relaxed pl-1">
                    {text}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link
            to="/map"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-fg shadow hover:opacity-95"
          >
            Ver mapa colaborativo
          </Link>
          <Link
            to="/faq"
            className="inline-flex items-center justify-center rounded-xl border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10"
          >
            Ir para o FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
