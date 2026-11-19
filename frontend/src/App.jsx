import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, X, Users, Home, Compass, RotateCcw, MapPin, Sparkles } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function App() {
  const [tab, setTab] = useState("discover");
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [matchPopup, setMatchPopup] = useState(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const start = useRef(null);
  const dragX = useRef(0);
  const cardRef = useRef(null);

  const loadFeed = useCallback(async () => {
    try {
      setError("");
      const data = await api("/feed");
      setProfiles(data.profiles);
    } catch (err) {
      setError(`${err.message}. Make sure the backend server is running.`);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      const data = await api("/matches");
      setMatches(data.matches);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadFeed(); loadMatches(); }, [loadFeed, loadMatches]);

  const swipe = async (action) => {
    if (!profiles.length || busy) return;
    setBusy(true);
    const current = profiles[0];
    try {
      const result = await api("/swipe", {
        method: "POST",
        body: JSON.stringify({ profileId: current.id, action })
      });
      setProfiles((items) => items.filter((item) => item.id !== current.id));
      dragX.current = 0;
      setDrag({ x: 0, y: 0 });
      if (result.matched) {
        setMatchPopup(result.match);
        loadMatches();
      } else {
        setToast(action === "like" ? "Liked" : "Passed");
        window.setTimeout(() => setToast(""), 1000);
      }
    } catch (err) {
      setError(err.message);
      await loadFeed();
    } finally {
      setBusy(false);
    }
  };

  const onPointerDown = (event) => {
    if (busy) return;
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!start.current) return;
    const x = event.clientX - start.current.x;
    dragX.current = x;
    setDrag({ x, y: event.clientY - start.current.y });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    const dx = dragX.current;
    start.current = null;
    dragX.current = 0;
  
    if (dx > 100) swipe("like");
    else if (dx < -100) swipe("pass");
    else setDrag({ x: 0, y: 0 });
  };

  const current = profiles[0];
  const rotation = drag.x / 18;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}><span className="brand-mark">c</span> coy</a>
        <div className="top-note"><Sparkles size={15} /> Meet someone new</div>
        <div className="avatar-mini">Y</div>
      </header>

      <main className="main">
        <section className="intro">
          <p className="eyebrow">YOUR NEXT CONNECTION</p>
          <h1>{tab === "discover" ? "Discover" : tab === "matches" ? "Your matches" : "Home"}</h1>
          <p className="subheading">{tab === "discover" ? "A little curiosity can go a long way." : tab === "matches" ? "Only mutual connections appear here." : "Welcome to Coy."}</p>
        </section>

        <nav className="tabs" aria-label="Main navigation">
          <button className={tab === "home" ? "tab active" : "tab"} onClick={() => setTab("home")}><Home size={17}/> Home</button>
          <button className={tab === "discover" ? "tab active" : "tab"} onClick={() => setTab("discover")}><Compass size={17}/> Discover</button>
          <button className={tab === "matches" ? "tab active" : "tab"} onClick={() => { setTab("matches"); loadMatches(); }}><Users size={17}/> Matches <span className="count">{matches.length}</span></button>
        </nav>

        {error && <div className="error">{error}</div>}

        {tab === "home" && <div className="blank-home"><div className="blank-icon"><Home size={26}/></div><h2>Your Home tab</h2><p>This is a placeholder, as requested in the assignment.</p></div>}

        {tab === "discover" && (
          <section className="discover-layout">
            <div className="card-area">
              {loading ? <div className="empty"><div className="loader"/><p>Finding people nearby...</p></div> :
                current ? (
                  <div className="profile-card-wrap">
                    <div
                      ref={cardRef}
                      className="profile-card"
                      style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`, transition: start.current ? "none" : "transform .25s ease" }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                    >
                      <img className="profile-photo" src={current.photo} alt={`${current.name}'s profile`} draggable="false" />
                      <div className="photo-shade"/>
                      <div className="swipe-label like-label" style={{ opacity: Math.min(Math.max(drag.x / 100, 0), 1) }}>LIKE</div>
                      <div className="swipe-label pass-label" style={{ opacity: Math.min(Math.max(-drag.x / 100, 0), 1) }}>PASS</div>
                      <div className="profile-info">
                        <div className="name-line"><h2>{current.name}, {current.age}</h2><span className="online-dot"/></div>
                        <p className="location"><MapPin size={15}/> {current.city}</p>
                        <p className="bio">{current.bio}</p>
                        <div className="interests">{current.interests.map((interest) => <span key={interest}>{interest}</span>)}</div>
                      </div>
                    </div>
                    <div className="swipe-actions">
                      <button className="action-btn pass" onClick={() => swipe("pass")} disabled={busy} aria-label="Pass"><X size={28}/></button>
                      <button className="action-btn like" onClick={() => swipe("like")} disabled={busy} aria-label="Like"><Heart size={26} fill="currentColor"/></button>
                    </div>
                    <p className="hint">Drag right to like · drag left to pass</p>
                  </div>
                ) : (
                  <div className="empty">
                    <div className="empty-icon"><Heart size={28}/></div>
                    <h2>You've seen everyone!</h2>
                    <p>There are no more profiles to discover right now.</p>
                    <button className="secondary-btn" onClick={loadFeed}><RotateCcw size={16}/> Refresh feed</button>
                  </div>
                )}
            </div>
            <aside className="privacy-card"><div className="privacy-icon"><Heart size={19}/></div><h3>Private by design</h3><p>You’ll only know someone likes you when you both like each other. Your experience stays private until it’s a match.</p><div className="privacy-line"/></aside>
          </section>
        )}

        {tab === "matches" && (
          <section className="matches-section">
            {matches.length ? <div className="matches-grid">{matches.map((person) => (
              <article className="match-card" key={person.id}>
                <img src={person.photo} alt={person.name}/>
                <div><h3>{person.name}, {person.age}</h3><p><MapPin size={13}/> {person.city}</p><span className="mutual-tag">It's mutual ♥</span></div>
              </article>
            ))}</div> : <div className="empty matches-empty"><div className="empty-icon"><Users size={28}/></div><h2>No matches yet</h2><p>When you and someone else like each other, they'll show up here.</p><button className="secondary-btn" onClick={() => setTab("discover")}><Compass size={16}/> Explore Discover</button></div>}
          </section>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
      {matchPopup && <div className="modal-backdrop"><div className="match-modal">
        <div className="sparkle">✦</div><p className="eyebrow">IT'S MUTUAL</p><h2>It's a match!</h2>
        <img src={matchPopup.photo} alt={matchPopup.name}/>
        <h3>You and {matchPopup.name} liked each other.</h3>
        <p>Good things start with a hello.</p>
        <button className="primary-btn" onClick={() => { setMatchPopup(null); setTab("matches"); }}>See your matches</button>
        <button className="text-btn" onClick={() => setMatchPopup(null)}>Keep discovering</button>
      </div></div>}
      <footer>COY DISCOVER <span>•</span> A DEMO EXPERIENCE</footer>
    </div>
  );
}

export default App;
