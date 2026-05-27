type Props = {
  isPrivate?: boolean;
  className?: string;
};

export default function GroupTypeBadge({ isPrivate, className = '' }: Props) {
  if (isPrivate) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-900 dark:text-sky-200 ${className}`}
      >
        Contato salvo
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200 ${className}`}
    >
      Grupo de busca
    </span>
  );
}
