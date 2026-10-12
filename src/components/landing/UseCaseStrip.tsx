import { useCases } from './landing-data'

export function UseCaseStrip() {
  return (
    <div className="landing-strip">
      <div className="landing-container">
        <ul className="landing-strip-list" aria-label="Jenis website yang cocok dibuat">
          <li className="landing-strip-title" aria-hidden="true">
            Cocok untuk membuat
          </li>
          {useCases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
