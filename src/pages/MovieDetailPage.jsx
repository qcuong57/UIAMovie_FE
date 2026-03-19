// src/pages/MovieDetailPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronLeft, Star, Heart, SkipForward, SkipBack } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import movieService from '../services/movieService';
import PersonScrollRow from '../components/movie/Personscrollrow';
import ReviewSection from '../components/movie/Reviewsection';

const C = {
  bg:          '#0a0a0a',
  surface:     '#111111',
  surfaceHigh: '#181818',
  surfaceMid:  '#1f1f1f',
  card:        '#161616',
  border:      'rgba(255,255,255,0.06)',
  borderCard:  'rgba(255,255,255,0.08)',
  accent:      '#e50914',
  text:        '#ffffff',
  textSub:     '#a3a3a3',
  textDim:     '#616161',
  green:       '#46d369',
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ── PersonCard — chữ nhật kiểu TMDB ────────────────────────────
const PersonCard = ({ person, isDirector = false }) => {
  const [err, setErr] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      style={{
        width: 140,
        flexShrink: 0,
        borderRadius: 10,
        overflow: 'hidden',
        background: C.card,
        border: `1px solid ${C.borderCard}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        cursor: 'pointer',
      }}
    >
      {/* Ảnh — tỉ lệ 2:3 như TMDB */}
      <div style={{ width: '100%', aspectRatio: '2/3', background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
        {person.profileUrl && !err ? (
          <img
            src={person.profileUrl}
            alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            onError={() => setErr(true)}
          />
        ) : (
          /* Placeholder */
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1c1c' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#3a3a3a"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 12px 14px' }}>
        <p style={{
          fontFamily: "'Nunito',sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.35,
          marginBottom: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {person.name || 'Chưa có tên'}
        </p>

        {isDirector ? (
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11.5, color: C.textSub, fontStyle: 'italic' }}>
            Đạo diễn
          </p>
        ) : person.character ? (
          <p style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: 11.5,
            color: C.textSub,
            fontStyle: 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
          }}>
            {person.character}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
};

// ── VideoPlayer ─────────────────────────────────────────────────
const VideoPlayer = ({ movie }) => {
  const [playing, setPlaying]   = useState(false);
  const [muted, setMuted]       = useState(false);
  const [progress, setProgress] = useState(0);
  const [show, setShow]         = useState(true);
  const [vol, setVol]           = useState(80);
  const [buffered]              = useState(65);
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { if (playing) setShow(false); }, 3500);
  }, [playing]);

  useEffect(() => {
    if (!playing) { setShow(true); return; }
    const iv = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 0.08), 200);
    return () => clearInterval(iv);
  }, [playing]);

  const totalSec = 7200;
  const curSec   = Math.floor(progress / 100 * totalSec);
  const fmt      = s => `${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ position:'relative', width:'100%', borderRadius:12, overflow:'hidden', aspectRatio:'16/9', background:'#000', cursor: show ? 'default' : 'none' }}
      onMouseMove={resetTimer} onMouseLeave={() => playing && setShow(false)}>

      {movie?.backdropUrl && (
        <img src={movie.backdropUrl} alt=""
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity: playing ? 0.35 : 0.6, transition:'opacity 0.6s' }} />
      )}

      <AnimatePresence>
        {!playing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)' }}>
            <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }} onClick={() => setPlaying(true)}
              style={{ width:68, height:68, borderRadius:'50%', background:'rgba(255,255,255,0.95)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
              <Play size={28} fill="#000" color="#000" style={{ marginLeft:3 }}/>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}
            style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 20px 16px', background:'linear-gradient(transparent,rgba(0,0,0,0.85) 60%)' }}>
            <div style={{ marginBottom:12, position:'relative', height:3, cursor:'pointer' }}
              onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setProgress(((e.clientX-r.left)/r.width)*100); }}>
              <div style={{ position:'absolute', inset:0, borderRadius:2, background:'rgba(255,255,255,0.2)' }}/>
              <div style={{ position:'absolute', top:0, left:0, bottom:0, width:`${buffered}%`, borderRadius:2, background:'rgba(255,255,255,0.35)' }}/>
              <div style={{ position:'absolute', top:0, left:0, bottom:0, width:`${progress}%`, borderRadius:2, background:C.accent, transition:'width 0.2s' }}/>
              <div style={{ position:'absolute', top:'50%', left:`${progress}%`, transform:'translate(-50%,-50%)', width:12, height:12, borderRadius:'50%', background:'white', transition:'left 0.2s' }}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <button onClick={() => setProgress(p => Math.max(0,p-1.4))} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)',padding:0,display:'flex' }}><SkipBack size={18}/></button>
                <button onClick={() => setPlaying(!playing)} style={{ background:'none',border:'none',cursor:'pointer',color:'white',padding:0,display:'flex' }}>
                  {playing ? <Pause size={22} fill="white"/> : <Play size={22} fill="white"/>}
                </button>
                <button onClick={() => setProgress(p => Math.min(100,p+1.4))} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)',padding:0,display:'flex' }}><SkipForward size={18}/></button>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={() => setMuted(!muted)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.8)',padding:0,display:'flex' }}>
                    {muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                  </button>
                  <input type="range" min="0" max="100" value={muted ? 0 : vol}
                    onChange={e => { setVol(+e.target.value); setMuted(false); }}
                    style={{ width:72, accentColor:'white', cursor:'pointer' }} />
                </div>
                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, fontFamily:"'Nunito',sans-serif" }}>{fmt(curSec)} / {fmt(totalSec)}</span>
              </div>
              <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.querySelector('video')?.requestFullscreen?.()}
                style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)',padding:0,display:'flex' }}>
                <Maximize size={18}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function MovieDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [movie, setMovie]     = useState(null);
  const [dirs, setDirs]       = useState([]);
  const [actors, setActors]   = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fav, setFav]         = useState(false);
  const [tab, setTab]         = useState('cast');
  const [currentUser] = useState(() => {
    try { const r = localStorage.getItem('currentUser'); return r ? JSON.parse(r) : null; }
    catch { return null; }
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setDirs([]);
        setActors([]);
        // Reset trước để không hiện dữ liệu phim cũ
        setDirs([]);
        setActors([]);
        const [movieRes, trendingRes] = await Promise.all([
          movieService.getMovieById(id),
          movieService.getTrendingMovies().catch(() => ({ data: [] })),
        ]);
        const movieData = movieRes?.data ?? movieRes;
        setMovie(movieData);

        if (movieData?.director) {
          setDirs([{ name: movieData.director, profileUrl: null }]);
        }
        if (Array.isArray(movieData?.cast) && movieData.cast.length > 0) {
          setActors(movieData.cast.sort((a, b) => a.order - b.order).map(c => ({
            name: c.name, character: c.character, profileUrl: c.profileUrl,
          })));
        }
        const tRaw   = trendingRes?.data ?? trendingRes;
        const movies = Array.isArray(tRaw) ? tRaw : tRaw?.movies ?? [];
        setRelated(movies.filter(x => x.id !== id).slice(0, 12).map(x => ({
          id: x.id, title: x.title,
          year: x.releaseDate ? new Date(x.releaseDate).getFullYear() : x.year,
          rating: x.rating, posterUrl: x.posterUrl,
        })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg }}>
      <motion.div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${C.accent}`, borderTopColor:'transparent' }}
        animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:0.85, ease:'linear' }}/>
    </div>
  );

  const year    = movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : movie?.year ?? '';
  const hasCast = dirs.length > 0 || actors.length > 0;
  const TABS    = [
    { key: 'cast',    label: 'Diễn viên & Đạo diễn' },
    { key: 'reviews', label: 'Đánh giá' },
    { key: 'more',    label: 'Thêm thông tin' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, paddingTop:56 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
        .no-scroll::-webkit-scrollbar{display:none}
        .no-scroll{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* Nav */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(10,10,10,0.92)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.border}`, padding:'0 32px', height:56, display:'flex', alignItems:'center', gap:16 }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', cursor:'pointer', color:C.textSub, display:'flex', alignItems:'center', gap:6, padding:'6px 0' }}>
          <ChevronLeft size={18}/>
          <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:500 }}>Quay lại</span>
        </button>
        <div style={{ flex:1 }}/>
        <button onClick={() => setFav(!fav)} style={{ background:'none', border:`1.5px solid ${fav ? C.accent : 'rgba(255,255,255,0.15)'}`, borderRadius:'50%', width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
          <Heart size={15} fill={fav ? C.accent : 'none'} color={fav ? C.accent : C.textSub}/>
        </button>
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 32px 64px' }}>
        <div style={{ display:'flex', gap:40, alignItems:'flex-start' }}>

          {/* LEFT */}
          <div style={{ flex:1, minWidth:0 }}>
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration:0.5 }}>
              <VideoPlayer movie={movie}/>
            </motion.div>

            {/* Title block */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration:0.5, delay:0.1 }} style={{ marginTop:24, marginBottom:28 }}>
              <h1 style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:38, letterSpacing:'0.02em', lineHeight:1, marginBottom:12 }}>
                {movie?.title}
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16, flexWrap:'wrap' }}>
                {movie?.rating && (
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Star size={13} style={{ fill:'#f5c518', color:'#f5c518' }}/>
                    <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:700, color:'#f5c518' }}>{movie.rating.toFixed(1)}</span>
                  </div>
                )}
                {year && <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:C.textSub }}>{year}</span>}
                {movie?.duration && <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:C.textSub }}>{movie.duration} phút</span>}
                {movie?.genres?.slice(0,2).map(g => (
                  <span key={g} style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:C.textSub, padding:'2px 10px', border:`1px solid rgba(255,255,255,0.12)`, borderRadius:20 }}>{g}</span>
                ))}
                {movie?.rating && (
                  <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, fontWeight:700, color:C.green }}>
                    {Math.round(movie.rating * 10)}% phù hợp
                  </span>
                )}
              </div>
              {movie?.description && (
                <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, color:C.textSub, lineHeight:1.7, maxWidth:680 }}>
                  {movie.description}
                </p>
              )}
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 28px', background:'white', color:'black', border:'none', borderRadius:6, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:700 }}>
                  <Play size={18} fill="black"/> Phát
                </motion.button>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => setFav(!fav)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 24px', background:'rgba(109,109,110,0.7)', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:600 }}>
                  <Heart size={17} fill={fav ? C.accent : 'none'} color={fav ? C.accent : 'white'}/>
                  {fav ? 'Đã thêm' : 'Yêu thích'}
                </motion.button>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay:0.2 }}>
              <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:32 }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===t.key ? C.accent : 'transparent'}`, padding:'12px 20px', cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:tab===t.key ? 700 : 500, color:tab===t.key ? C.text : C.textSub, transition:'all 0.2s', marginBottom:-1 }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* CAST */}
                {tab === 'cast' && (
                  <motion.div key="cast" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                    {!hasCast ? (
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:14 }}>
                        <div style={{ width:64, height:64, borderRadius:'50%', background:C.surfaceMid, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🎭</div>
                        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:600, color:C.textSub }}>Chưa có thông tin diễn viên</p>
                        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:C.textDim, textAlign:'center', maxWidth:300, lineHeight:1.6 }}>
                          Thử import lại từ TMDB để cập nhật.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:40 }}>

                        {/* Đạo diễn */}
                        {dirs.length > 0 && (
                          <div>
                            <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:C.textDim, textTransform:'uppercase', marginBottom:20 }}>
                              Đạo diễn
                            </p>
                            <div style={{ display:'flex', gap:16 }}>
                              {dirs.map((p, i) => (
                                <PersonCard key={i} person={p} isDirector={true}/>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Diễn viên */}
                        {actors.length > 0 && (
                          <div>
                            <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:20 }}>
                              <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:C.textDim, textTransform:'uppercase' }}>
                                Diễn viên nổi bật
                              </p>
                              <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:C.textDim }}>
                                {actors.length} người
                              </span>
                            </div>
                            <PersonScrollRow people={actors} />
                          </div>
                        )}

                      </div>
                    )}
                  </motion.div>
                )}

                {/* REVIEWS */}
                {tab === 'reviews' && (
                  <motion.div key="reviews" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                    <ReviewSection
                      movieId={id}
                      movieRating={movie?.rating}
                      voteCount={movie?.voteCount}
                      currentUser={currentUser}
                    />
                  </motion.div>
                )}

                {/* MORE */}
                {tab === 'more' && (
                  <motion.div key="more" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 40px', maxWidth:560 }}>
                      {[
                        ['Thể loại',        movie?.genres?.join(', ') || '—'],
                        ['Năm phát hành',   year || '—'],
                        ['Thời lượng',      movie?.duration ? `${movie.duration} phút` : '—'],
                        ['Điểm đánh giá',   movie?.rating   ? `${movie.rating.toFixed(1)} / 10` : '—'],
                        ['Đạo diễn',        dirs.map(d => d.name).join(', ') || '—'],
                        ['Diễn viên chính', actors.slice(0,3).map(a => a.name).join(', ') || '—'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:12 }}>
                          <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</p>
                          <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, color:C.text, fontWeight:500 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </div>

          {/* RIGHT sidebar */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay:0.15 }}
            style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', gap:28 }}>

            {movie?.posterUrl && (
              <div style={{ borderRadius:8, overflow:'hidden' }}>
                <img src={movie.posterUrl} alt={movie.title} style={{ width:'100%', display:'block' }}/>
              </div>
            )}

            {/* Đạo diễn sidebar */}
            {dirs.length > 0 && (
              <div>
                <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.textDim, textTransform:'uppercase', marginBottom:16 }}>Đạo diễn</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {dirs.map((p, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:56, height:56, borderRadius:'50%', border:`1.5px solid rgba(255,255,255,0.12)`, overflow:'hidden', background:C.surfaceMid, flexShrink:0 }}>
                        {p.profileUrl
                          ? <img src={p.profileUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 15%' }}/>
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:C.textDim, fontFamily:"'Be Vietnam Pro',sans-serif" }}>{p.name?.charAt(0)}</div>
                        }
                      </div>
                      <div>
                        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600, color:C.text }}>{p.name}</p>
                        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:C.textSub, marginTop:1, fontStyle:'italic' }}>Đạo diễn</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diễn viên sidebar */}
            {actors.length > 0 ? (
              <div>
                <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.textDim, textTransform:'uppercase', marginBottom:16 }}>Diễn viên chính</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {actors.slice(0, 6).map((p, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:56, height:56, borderRadius:'50%', border:`1.5px solid rgba(255,255,255,0.1)`, overflow:'hidden', background:C.surfaceMid, flexShrink:0 }}>
                        {p.profileUrl
                          ? <img src={p.profileUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 15%' }}/>
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:C.textDim, fontFamily:"'Be Vietnam Pro',sans-serif" }}>{p.name?.charAt(0)}</div>
                        }
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:500, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</p>
                        {p.character && <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:C.textDim, marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontStyle:'italic' }}>{p.character}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding:16, background:C.surfaceMid, borderRadius:8, border:`1px solid ${C.border}` }}>
                <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:C.textDim, textAlign:'center' }}>Chưa có thông tin diễn viên</p>
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div>
                <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.textDim, textTransform:'uppercase', marginBottom:16 }}>Có thể bạn thích</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {related.slice(0, 5).map(m => (
                    <motion.div key={m.id} whileHover={{ x:3 }} onClick={() => navigate(`/movie/${m.id}`)}
                      style={{ display:'flex', gap:10, cursor:'pointer', alignItems:'center' }}>
                      <div style={{ width:60, height:85, borderRadius:6, overflow:'hidden', background:C.surfaceMid, flexShrink:0 }}>
                        {m.posterUrl
                          ? <img src={m.posterUrl} alt={m.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🎬</div>
                        }
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:500, color:C.text, marginBottom:4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{m.title}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {m.rating && <><Star size={10} style={{ fill:'#f5c518', color:'#f5c518', flexShrink:0 }}/><span style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:'#f5c518' }}>{m.rating.toFixed(1)}</span></>}
                          {m.year && <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:C.textDim }}>{m.year}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}