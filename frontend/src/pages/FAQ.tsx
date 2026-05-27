import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiChevronDown, HiQuestionMarkCircle } from 'react-icons/hi2';

const faqItems = [
  {
    pergunta: 'O que é o Sagasu?',
    resposta: 'O Sagasu é uma plataforma web colaborativa que ajuda na localização de idosos desaparecidos, em especial aqueles com doenças cognitivas como Alzheimer. Familiares registram o caso, a comunidade pode enviar dicas e avistamentos, e voluntários e grupos se organizam para apoiar as buscas.',
  },
  {
    pergunta: 'Posso enviar informações de forma anônima?',
    resposta: 'Sim. Ao enviar uma dica ou avistamento, você pode escolher permanecer anônimo. Sua informação ainda será útil para a família e para as buscas, e ninguém verá seu nome ou contato se você optar pelo anonimato.',
  },
  {
    pergunta: 'Como me torno voluntário em um caso?',
    resposta: 'Na página de cada caso existe a opção "Quero ajudar". Ao clicar, sua solicitação é enviada ao responsável pelo caso, que pode aprovar ou não. Depois de aprovado, você pode participar de grupos de busca e receber atualizações sobre o caso.',
  },
  {
    pergunta: 'O Sagasu substitui a polícia ou o SAMU?',
    resposta: 'Não. Em situação de emergência ou perigo imediato, sempre ligue para a polícia (190) ou SAMU (192). O Sagasu é uma ferramenta de divulgação e rede colaborativa que complementa as ações oficiais, ajudando a espalhar a informação e a organizar a comunidade.',
  },
  {
    pergunta: 'Quem pode criar um caso de desaparecimento?',
    resposta: 'Qualquer pessoa que se cadastrar na plataforma pode registrar um caso. Recomendamos que seja um familiar ou responsável direto pela pessoa desaparecida, com dados e fotos atualizados, para que a divulgação seja precisa e segura.',
  },
  {
    pergunta: 'As fotos e dados são seguros?',
    resposta: 'Buscamos tratar seus dados com cuidado. As informações do caso são usadas apenas para fins de busca e divulgação no próprio Sagasu e em compartilhamentos que você autorizar. Não vendemos dados a terceiros.',
  },
  {
    pergunta: 'O que fazer se eu vir alguém que pode ser a pessoa desaparecida?',
    resposta: 'Envie uma dica ou avistamento pelo caso correspondente, informando o local, horário e, se possível, uma foto (respeitando a dignidade da pessoa). Você pode fazer isso de forma anônima. Se a pessoa estiver em risco, acione também a polícia ou o SAMU.',
  },
  {
    pergunta: 'Há algum custo para usar o Sagasu?',
    resposta: 'A ideia é que o uso básico da plataforma seja gratuito para famílias e voluntários. Assim, o máximo de pessoas pode se beneficiar da rede colaborativa sem barreiras financeiras.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-dark via-dark/92 to-primary/25 text-white py-12 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 text-primary mb-4">
            <HiQuestionMarkCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Perguntas frequentes</h1>
          <p className="text-primary/90">
            Tire suas dúvidas sobre o Sagasu e sobre como participar.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-primary/5 transition-colors"
                >
                  <span className="font-semibold text-dark pr-2">{item.pergunta}</span>
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-dark transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <HiChevronDown className="w-5 h-5" />
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-0 border-t border-primary/10">
                      <p className="text-dark/90 text-sm leading-relaxed pt-4">
                        {item.resposta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-dark/70 text-sm mt-10">
          Não encontrou sua dúvida?{' '}
          <Link to="/contact" className="text-primary font-medium hover:underline">
            Entre em contato
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
