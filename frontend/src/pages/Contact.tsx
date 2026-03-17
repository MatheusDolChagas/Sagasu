import { HiChatBubbleLeftRight, HiEnvelope, HiMapPin } from 'react-icons/hi2';

const WHATSAPP_NUMBER = '5531995617797';
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function Contact() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-dark text-white py-12 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold mb-3">Contato</h1>
          <p className="text-primary/90">
            Estamos aqui para ajudar. Escolha a melhor forma de falar conosco.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* WhatsApp - destaque */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-primary/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-600">
              <HiChatBubbleLeftRight className="w-8 h-8" />
            </div>
            <div className="flex-grow">
              <h2 className="text-xl font-bold text-dark mb-1">WhatsApp</h2>
              <p className="text-dark/80 mb-4">
                Resposta rápida pelo WhatsApp. Envie sua dúvida, sugestão ou pedido de apoio.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Outros canais */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-primary/10 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center text-dark mb-4">
              <HiEnvelope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">E-mail</h3>
            <p className="text-dark/80 text-sm mb-3">
              Para parcerias, imprensa ou contato institucional.
            </p>
            <a
              href="mailto:contato@sagasu.com.br"
              className="text-primary font-medium hover:underline"
            >
              contato@sagasu.com.br
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-primary/10 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center text-dark mb-4">
              <HiMapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Onde estamos</h3>
            <p className="text-dark/80 text-sm">
              Sagasu é um projeto desenvolvido no Brasil, com foco em apoiar famílias e comunidades em todo o território nacional.
            </p>
          </div>
        </div>

        {/* Mensagem de apoio */}
        <div className="mt-10 text-center">
          <p className="text-dark/80 text-sm max-w-xl mx-auto">
            Em caso de <strong>emergência ou pessoa em perigo imediato</strong>, ligue para a polícia (190) ou SAMU (192). O Sagasu complementa essas ações com divulgação e rede colaborativa.
          </p>
        </div>
      </div>
    </div>
  );
}
