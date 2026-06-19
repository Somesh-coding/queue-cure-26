import { useEffect, useMemo, useState } from "react";
import { queueApi } from "./api";
import { connectQueueSocket } from "./socket";

const emptyStatus = {
  currentToken: null,
  currentPatientName: null,
  avgConsultationTime: 10,
  actualAverageMinutes: 10,
  waitingCount: 0,
  completedCount: 0,
  patients: []
};

export default function App() {
  const [screen, setScreen] = useState("reception");
  const [status, setStatus] = useState(emptyStatus);
  const [name, setName] = useState("");
  const [avg, setAvg] = useState(10);
  const [socketState, setSocketState] = useState("connecting");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("Ready for clinic rush hour");

  const patients = status.patients || [];
  const waiting = patients.filter((p) => p.status === "WAITING");
  const completed = patients.filter((p) => p.status === "COMPLETED");

  const projectedLoad = useMemo(() => {
    const minutes = waiting.length * (status.avgConsultationTime || avg || 10);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }, [waiting.length, status.avgConsultationTime, avg]);

  async function refresh() {
    try {
      const data = await queueApi.getStatus();
      setStatus(data);
      setAvg(data.avgConsultationTime || 10);
      if (socketState === "offline") setSocketState("syncing");
    } catch {
      setSocketState("offline");
      setToast("Backend not connected. Check VITE_API_BASE_URL or start backend on 8080.");
    }
  }

  useEffect(() => {
    refresh();
    const disconnect = connectQueueSocket(
      (event) => {
        if (event?.payload) {
          setStatus(event.payload);
          setAvg(event.payload.avgConsultationTime || 10);
          setToast(event.type?.replaceAll("_", " ") || "Queue updated");
        } else {
          refresh();
        }
      },
      setSocketState
    );
    const poll = setInterval(refresh, 5000);
    return () => {
      disconnect();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAction(action, message) {
    setBusy(true);
    try {
      const data = await action();
      if (data?.patients) setStatus(data);
      setToast(message);
    } catch (err) {
      setToast(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function addPatient(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return setToast("Enter patient name first");
    runAction(async () => {
      const data = await queueApi.addPatient(clean);
      setName("");
      return data;
    }, `Token generated for ${clean}`);
  }

  return (
    <div className="app-shell">
      <div className="grain" />
      <aside className="side-rail">
        <div className="brand-mark">QC</div>
        <button className={screen === "reception" ? "rail-active" : ""} onClick={() => setScreen("reception")}>Desk</button>
        <button className={screen === "patient" ? "rail-active" : ""} onClick={() => setScreen("patient")}>Room</button>
      </aside>

      <main className="stage">
        <header className="topbar">
          <div>
            <p className="eyebrow">Queue Cure '26 · Wooble Hackathon</p>
            <h1>Clinic queue, without shouting.</h1>
          </div>
          <div className={`signal ${socketState}`}>
            <span /> {socketState === "live" ? "Live WebSocket" : socketState === "offline" ? "Backend Offline" : "Fallback Sync"}
          </div>
        </header>

        <section className="toast">{toast}</section>

        {screen === "reception" ? (
          <ReceptionView
            name={name}
            setName={setName}
            addPatient={addPatient}
            avg={avg}
            setAvg={setAvg}
            status={status}
            waiting={waiting}
            completed={completed}
            patients={patients}
            projectedLoad={projectedLoad}
            busy={busy}
            onCallNext={() => runAction(queueApi.callNext, "Next token called")}
            onAvg={() => runAction(() => queueApi.updateAvgTime(avg), "Average consultation time updated")}
            onReset={() => runAction(queueApi.reset, "Queue reset for fresh demo")}
          />
        ) : (
          <PatientView status={status} waiting={waiting} projectedLoad={projectedLoad} />
        )}
      </main>
    </div>
  );
}

function ReceptionView({ name, setName, addPatient, avg, setAvg, status, waiting, completed, patients, projectedLoad, busy, onCallNext, onAvg, onReset }) {
  return (
    <div className="reception-grid page-enter">
      <section className="hero-card panel">
        <div className="hero-copy">
          <p className="tag">Reception command table</p>
          <h2>Issue tokens, move the queue, keep the room calm.</h2>
          <p>Every action broadcasts to patient screens through Spring Boot WebSocket and also has REST fallback refresh.</p>
        </div>
        <form onSubmit={addPatient} className="token-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient name, e.g. Anaya Verma" />
          <button disabled={busy}>Generate Token</button>
        </form>
        <button className="next-button" disabled={busy || waiting.length === 0} onClick={onCallNext}>Call Next Token</button>
      </section>

      <section className="panel time-panel">
        <p className="tag">Consultation pace</p>
        <div className="dial"><strong>{avg}</strong><span>min</span></div>
        <input type="range" min="1" max="60" value={avg} onChange={(e) => setAvg(Number(e.target.value))} />
        <div className="time-row"><input type="number" min="1" max="120" value={avg} onChange={(e) => setAvg(Number(e.target.value))} /><button onClick={onAvg}>Update</button></div>
        <small>Actual average after completed patients: {status.actualAverageMinutes || status.avgConsultationTime} min</small>
      </section>

      <section className="metric-card ink"><span>Now Serving</span><strong>{status.currentToken ?? "—"}</strong><p>{status.currentPatientName || "No active token"}</p></section>
      <section className="metric-card saffron"><span>Waiting</span><strong>{waiting.length}</strong><p>Projected load: {projectedLoad}</p></section>
      <section className="metric-card mint"><span>Completed</span><strong>{completed.length}</strong><p>Served in this demo</p></section>

      <section className="panel queue-board">
        <div className="board-head"><div><p className="tag">Live token ledger</p><h3>Patient Queue</h3></div><button className="ghost" onClick={onReset}>Reset demo</button></div>
        {patients.length === 0 ? <Empty /> : <div className="ledger">{patients.map((p, index) => <PatientRow key={p.id} patient={p} index={index} />)}</div>}
      </section>
    </div>
  );
}

function PatientView({ status, waiting, projectedLoad }) {
  return (
    <div className="patient-wall page-enter">
      <section className="now-serving">
        <p>अब बुलाया जा रहा है · Now Serving</p>
        <h2>{status.currentToken ?? "--"}</h2>
        <h3>{status.currentPatientName || "Please wait for the next token"}</h3>
      </section>
      <section className="waiting-strip">
        <div><span>Tokens waiting</span><strong>{waiting.length}</strong></div>
        <div><span>Average consult</span><strong>{status.avgConsultationTime} min</strong></div>
        <div><span>Room load</span><strong>{projectedLoad}</strong></div>
      </section>
      <section className="patient-grid">
        {waiting.length === 0 ? <Empty text="Waiting room is clear right now." /> : waiting.map((p, index) => (
          <article className="ticket" key={p.id} style={{ animationDelay: `${index * 70}ms` }}>
            <span className="ticket-notch" />
            <p>Token</p>
            <h4>#{p.token}</h4>
            <strong>{p.name}</strong>
            <div>{index} tokens ahead</div>
            <small>Estimated wait: {index * status.avgConsultationTime} min</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function PatientRow({ patient, index }) {
  return (
    <div className="ledger-row" style={{ animationDelay: `${index * 40}ms` }}>
      <b>#{patient.token}</b>
      <span>{patient.name}</span>
      <em className={patient.status.toLowerCase()}>{patient.status.replace("_", " ")}</em>
    </div>
  );
}

function Empty({ text = "No patients added yet. Generate the first token." }) {
  return <div className="empty-state">{text}</div>;
}
