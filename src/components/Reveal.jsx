import { m } from 'framer-motion'

/** Fade/slide-in on scroll. Respects prefers-reduced-motion via CSS + framer defaults. */
export default function Reveal({ children, delay = 0, y = 26, as = 'div', className, ...rest }) {
  const Tag = m[as] || m.div
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
