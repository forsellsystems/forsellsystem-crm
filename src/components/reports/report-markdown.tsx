import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Rapporten renderad som text att läsa, inte som rå markdown.
 *
 * Rapporterna bär tabeller (ICP-poäng, bokslut) och en mängd källänkar. Som
 * oformaterad text blir tabellerna rader av rörtecken och källorna oläsbara,
 * vilket är hela poängen med rapporten. Därför renderas markdown på riktigt.
 *
 * GFM krävs för tabellerna. Länkar öppnas i ny flik: källorna är externa och
 * ska inte ta över CRM-fönstret.
 */
export function ReportMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-[#1A1A1A]">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="font-display text-2xl text-[#1A1A1A] mt-6 first:mt-0 mb-3">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="font-condensed text-xs uppercase tracking-[0.12em] text-[#6B6B6B] mt-8 mb-2 border-t border-[#B8B8B8]/40 pt-4">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="font-medium text-[#1A1A1A] mt-5 mb-1.5">{children}</h5>
          ),
          p: ({ children }) => <p className="my-3">{children}</p>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#656565] underline underline-offset-2 hover:text-[#1A1A1A]"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-[#F2F2F0] px-1 py-0.5 text-[0.85em]">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-[#B8B8B8] pl-3 text-[#6B6B6B]">
              {children}
            </blockquote>
          ),
          // Breda tabeller ska rulla i sin egen ruta, inte dra ut sidan.
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-[#B8B8B8]/60 px-2 py-1.5 text-left font-condensed text-xs uppercase tracking-[0.08em] text-[#6B6B6B]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[#B8B8B8]/30 px-2 py-1.5 align-top">{children}</td>
          ),
          hr: () => <hr className="my-6 border-[#B8B8B8]/40" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
