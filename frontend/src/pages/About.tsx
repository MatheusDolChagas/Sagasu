import { Link } from 'react-router-dom';
import { HiHeart, HiUserGroup, HiMap, HiBolt } from 'react-icons/hi2';

export default function About() {
  const values = [
    {
      icon: HiHeart,
      title: 'Humanização',
      description: 'Cada caso é uma pessoa. Trabalhamos com empatia e respeito às famílias e aos idosos em situação de vulnerabilidade.',
    },
    {
      icon: HiUserGroup,
      title: 'Comunidade',
      description: 'Acreditamos que juntos somos mais fortes. O Sagasu conecta familiares, voluntários e autoridades em uma rede de apoio.',
    },
    {
      icon: HiMap,
      title: 'Localização',
      description: 'Geolocalização e mapas ajudam a coordenar buscas e a visualizar onde a pessoa foi vista pela última vez.',
    },
    {
      icon: HiBolt,
      title: 'Agilidade',
      description: 'Quanto mais rápido a informação circula, maiores as chances de localização. Notificações e divulgação em tempo real.',
    },
  ];

  const steps = [
    { step: 1, title: 'Cadastro do caso', text: 'O familiar ou responsável registra os dados do desaparecido e a última localização conhecida.' },
    { step: 2, title: 'Divulgação', text: 'O caso pode ser compartilhado em redes sociais e com grupos de busca para ampliar o alcance.' },
    { step: 3, title: 'Dicas e avistamentos', text: 'Qualquer pessoa pode enviar informações de forma anônima ou identificada, incluindo fotos e localização.' },
    { step: 4, title: 'Coordenação', text: 'Voluntários e grupos organizados ajudam nas buscas; autoridades podem ser acionadas diretamente.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-dark via-dark/95 to-primary/20 text-white py-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent/25 blur-3xl" />
        </div>
        <div className="relative container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre o Sagasu</h1>
          <p className="text-xl text-primary/95 max-w-2xl mx-auto">
            Um sistema web colaborativo para apoiar a localização de idosos desaparecidos, especialmente com doenças cognitivas como Alzheimer.
          </p>
        </div>
      </section>

      {/* Missão */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-8 md:p-12">
          <h2 className="text-2xl font-bold text-dark mb-4">Nossa missão</h2>
          <p className="text-dark text-lg leading-relaxed mb-4">
            O Sagasu nasceu da necessidade de unir tecnologia e solidariedade. Permitimos que familiares, voluntários, autoridades e a comunidade trabalhem juntos para encontrar pessoas desaparecidas de forma rápida, organizada e humana.
          </p>
          <p className="text-dark leading-relaxed">
            Focamos em idosos com doenças cognitivas porque são um grupo especialmente vulnerável: muitas vezes saem de casa sem noção de perigo e precisam de uma rede de apoio atenta e ágil. Cada minuto conta.
          </p>
        </div>
      </section>

      {/* Valores - cards */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-2xl font-bold text-dark text-center mb-10">O que nos guia</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center text-dark">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark mb-2">{title}</h3>
                <p className="text-dark/90">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-dark/5 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-dark text-center mb-10">Como o Sagasu funciona</h2>
          <div className="space-y-6">
            {steps.map(({ step, title, text }) => (
              <div
                key={step}
                className="flex gap-4 rounded-xl border-l-4 border-primary bg-card p-5 shadow-sm"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-dark font-bold flex items-center justify-center">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold text-dark mb-1">{title}</h3>
                  <p className="text-dark/90 text-sm md:text-base">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <p className="text-dark mb-6">
          Quer ajudar ou registrar um caso? Você pode começar navegando pelos casos ativos ou criando um novo registro.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 bg-primary text-dark px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Ver casos
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-dark text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Fale conosco
          </Link>
        </div>
      </section>
    </div>
  );
}
