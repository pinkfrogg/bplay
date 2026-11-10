type PrincessCrownProps = { className?: string };

/** A small three-point crown inspired by the Princess-and-the-Pauper shoulder tattoo reference. */
export default function PrincessCrown({ className = "" }: PrincessCrownProps) {
  return <img className={`princess-crown ${className}`} src="https://file.garden/ajiuqJaWwnaROsKw/barbie-assets/crownmark.png" role="img" aria-label="Princess crown" style={{ objectFit: 'contain' }} alt="Princess crown" />;
}
