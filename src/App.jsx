import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Plus,
  LayoutDashboard,
  History,
  Users,
  ChevronRight,
  Upload,
  Check,
  X,
  CreditCard,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { format, isSameQuarter, addMonths } from 'date-fns';
import { calculateBudget, BUDGETS } from './utils/BudgetLogic';
import { analyzeReceipt } from './utils/ReceiptProcessor';

const API_BASE = 'http://localhost:3000/api';

// --- Sub-components ---

const AuthView = ({ authView, setAuthView, onLogin, onSignup, idInput, setIdInput, pwInput, setPwInput }) => (
  <div className="fade-in" style={{ maxWidth: '400px', margin: '80px auto', padding: '20px' }}>
    <div className="glass-card" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>{authView === 'login' ? '로그인' : '회원가입'}</h2>
      <input className="input-field" placeholder="아이디" value={idInput} onChange={e => setIdInput(e.target.value)} />
      <input className="input-field" type="password" placeholder="비밀번호" value={pwInput} onChange={e => setPwInput(e.target.value)} />
      <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={authView === 'login' ? onLogin : onSignup}>
        {authView === 'login' ? '로그인하기' : '가입하기'}
      </button>
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        {authView === 'login' ? (
          <span onClick={() => setAuthView('signup')} style={{ cursor: 'pointer', color: 'var(--primary)' }}>아이디가 없으신가요? 회원가입</span>
        ) : (
          <span onClick={() => setAuthView('login')} style={{ cursor: 'pointer', color: 'var(--primary)' }}>이미 계정이 있으신가요? 로그인</span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = ({ selectedMonth, setSelectedMonth, budgetInfo, membersCount, onAddClick }) => (
  <div className="fade-in">
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn" style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}>&lt;</button>
          <h2 style={{ fontSize: '1.1rem' }}>{format(selectedMonth, 'yyyy년 MM월')}</h2>
          <button className="btn" style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>&gt;</button>
        </div>
        <PieChart size={24} color="var(--primary)" />
      </div>
      <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)' }}>
        ₩ {(budgetInfo.currentMonthRemaining || 0).toLocaleString()}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>
        남은 금액 (총 ₩ {(budgetInfo.currentMonthAvailable || 0).toLocaleString()} 중)
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '20px', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(100, (budgetInfo.currentMonthSpent / budgetInfo.currentMonthAvailable) * 100 || 0)}%`,
          height: '100%',
          background: 'var(--primary)'
        }}></div>
      </div>
    </div>

    <div className="stat-grid">
      <div className="stat-item">
        <div className="stat-label">분기 지출액</div>
        <div className="stat-value">₩ {(budgetInfo.totalSpentInQuarter || 0).toLocaleString()}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">팀원 수</div>
        <div className="stat-value">{membersCount} 명</div>
      </div>
    </div>

    <button className="btn btn-primary" style={{ width: '100%', padding: '20px' }} onClick={onAddClick}>
      <Plus size={24} /> 지출 내역 추가
    </button>

    <div style={{ marginTop: '30px' }}>
      <h3 style={{ marginBottom: '15px' }}>이번 달 요약</h3>
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-muted)' }}>이월된 예산</span>
          <span>₩ {(budgetInfo.rolloverFromPrevMonths || 0).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-muted)' }}>이번 달 기초 예산</span>
          <span>₩ {(budgetInfo.monthlyBase || 0).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <span>실제의 사용 금액</span>
          <span style={{ color: 'var(--primary)' }}>₩ {(budgetInfo.currentMonthSpent || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>
);

const HistoryView = ({ expenses, members, onEditExpense }) => (
  <div className="fade-in">
    <h2 style={{ marginBottom: '20px' }}>지출 내역</h2>
    {expenses.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>내역이 없습니다.</div>
    ) : (
      expenses.map(exp => (
        <div key={exp.id} className="glass-card" style={{ padding: '15px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => onEditExpense(exp)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{exp.store}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.date}</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary)' }}>₩ {exp.amount.toLocaleString()}</div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {exp.users.map(uid => {
              const userObj = members.find(m => m.id === uid);
              return (
                <span key={uid} style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                  {userObj ? userObj.name : 'Unknown'}
                </span>
              )
            })}
          </div>
        </div>
      ))
    )}
  </div>
);

const MembersView = ({ members, onEditMember, onAddMember }) => (
  <div className="fade-in">
    <h2 style={{ marginBottom: '20px' }}>팀원 목록</h2>
    {members.map(m => (
      <div key={m.id} className="glass-card" style={{ padding: '15px', display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }} onClick={() => onEditMember(m)}>
        <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>
          {m.name ? m.name[0] : '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold' }}>{m.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {m.role === 'MANAGER' ? '팀장' : '팀원'} (월 ₩ {(m.budgets?.length > 0 ? m.budgets[m.budgets.length - 1].amount : 0).toLocaleString()})
          </div>
        </div>
        <ChevronRight size={20} color="var(--text-muted)" />
      </div>
    ))}
    <button className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', marginTop: '10px' }} onClick={onAddMember}>
      팀원 추가
    </button>
  </div>
);

// --- Main App ---

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [idInput, setIdInput] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgetInfo, setBudgetInfo] = useState({
    currentMonthRemaining: 0,
    currentMonthAvailable: 0,
    currentMonthSpent: 0,
    totalSpentInQuarter: 0,
    rolloverFromPrevMonths: 0,
    monthlyBase: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingLeader, setIsEditingLeader] = useState(false);
  const [leaderNameInput, setLeaderNameInput] = useState('');
  const [newExpense, setNewExpense] = useState(null);
  const fileInputRef = useRef(null);

  const manager = members.find(m => m.role === 'MANAGER');

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) setUser({ id: savedUser });
    else if (window.location.hostname !== 'localhost') {
      // Auto-login for static demo pages
      setUser({ id: 'demo-user' });
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`${API_BASE}/data/${user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Fetch failed: ' + res.status);
          return res.json();
        })
        .then(data => {
          if (data.members) setMembers(data.members);
          if (data.expenses) setExpenses(data.expenses);
        })
        .catch(err => {
          console.warn('App: Backend API unavailable, loading from localStorage fallback');
          const localData = localStorage.getItem(`teamcard_data_${user.id}`);
          if (localData) {
            const parsed = JSON.parse(localData);
            setMembers(parsed.members || []);
            setExpenses(parsed.expenses || []);
          }
        });
    } else {
      setMembers([]);
      setExpenses([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && members.length > 0) {
      try {
        const info = calculateBudget(members, expenses, selectedMonth);
        setBudgetInfo(info);
        // Local Storage Fallback
        localStorage.setItem(`teamcard_data_${user.id}`, JSON.stringify({ members, expenses }));

        fetch(`${API_BASE}/save/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members, expenses })
        }).then(res => res.json()).catch(() => console.log('App: API Save skipped (static mode)'));
      } catch (err) {
        console.error('App: Error in budget calculation or save', err);
      }
    }
  }, [members, expenses, selectedMonth, user]);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idInput, password: pwInput })
      });
      const data = await res.json();
      if (data.success) { setUser({ id: data.id }); localStorage.setItem('auth_user', data.id); }
      else alert(data.error);
    } catch (e) { alert('서버 연결 실패'); }
  };

  const handleSignup = async () => {
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idInput, password: pwInput })
      });
      const data = await res.json();
      if (data.success) { alert('회원가입 성공!'); setAuthView('login'); }
      else alert(data.error);
    } catch (e) { alert('서버 연결 실패'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsProcessing(true);
    const result = await analyzeReceipt(file);
    setNewExpense({ ...result, id: Date.now(), users: members.length > 0 ? [members[0].id] : [] });
    setIsProcessing(false);
  };

  const handleManualAdd = () => {
    setNewExpense({ id: Date.now(), store: '', amount: 0, date: new Date().toISOString().split('T')[0], users: members.length > 0 ? [members[0].id] : [] });
  };

  const saveExpense = () => {
    if (!newExpense.store || !newExpense.amount) return;
    const isEdit = expenses.some(e => e.id === newExpense.id);
    if (isEdit) setExpenses(expenses.map(e => e.id === newExpense.id ? newExpense : e));
    else setExpenses([newExpense, ...expenses]);
    setNewExpense(null); setIsAdding(false); setView('history');
  };

  const deleteExpense = (id) => {
    if (window.confirm('삭제하시겠습니까?')) { setExpenses(expenses.filter(e => e.id !== id)); setNewExpense(null); setIsAdding(false); }
  };

  const toggleUserSelection = (userId) => {
    const currentUsers = [...newExpense.users];
    if (currentUsers.includes(userId)) {
      if (currentUsers.length > 1) setNewExpense({ ...newExpense, users: currentUsers.filter(id => id !== userId) });
    } else setNewExpense({ ...newExpense, users: [...currentUsers, userId] });
  };

  const addMember = () => {
    const name = window.prompt('팀원 이름을 입력하세요:');
    if (name) setMembers([...members, { id: Date.now(), name, role: 'MEMBER', budgets: [{ amount: 30000, effectiveDate: format(new Date(), 'yyyy-MM') }] }]);
  };

  const editMember = (m) => {
    const action = window.prompt('1: 이름 수정, 2: 예산 설정', '1');
    if (action === '1') {
      const n = window.prompt('새 이름:', m.name);
      if (n) setMembers(members.map(mb => mb.id === m.id ? { ...mb, name: n } : mb));
    } else if (action === '2') {
      const amt = parseInt(window.prompt('새 예산:', 30000));
      const dt = window.prompt('적용 월(yyyy-MM):', format(new Date(), 'yyyy-MM'));
      if (!isNaN(amt) && dt) {
        const upBudgets = [...(m.budgets || []), { amount: amt, effectiveDate: dt }];
        setMembers(members.map(mb => mb.id === m.id ? { ...mb, budgets: upBudgets } : mb));
      }
    }
  };

  const handleSaveLeaderName = () => {
    if (!leaderNameInput.trim()) return;
    setMembers(members.map(m => m.role === 'MANAGER' ? { ...m, name: leaderNameInput } : m));
    setIsEditingLeader(false);
  };

  if (!user) {
    return <AuthView authView={authView} setAuthView={setAuthView} onLogin={handleLogin} onSignup={handleSignup} idInput={idInput} setIdInput={setIdInput} pwInput={pwInput} setPwInput={setPwInput} />;
  }

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard color="var(--primary)" /> Team Card
        </h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            {manager ? manager.name : user.id}
            <button className="btn" style={{ padding: '4px', background: 'transparent', minHeight: 'auto' }} onClick={() => { setLeaderNameInput(manager ? manager.name : ''); setIsEditingLeader(true); }}>
              <Plus size={16} color="var(--primary)" style={{ transform: 'rotate(45deg)' }} title="이름 수정" />
            </button>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
            <span>{user.id}</span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setUser(null); localStorage.removeItem('auth_user'); }}>로그아웃</span>
          </div>
        </div>
      </header>
      <div className="main-layout" style={{ display: 'contents' }}>
        <nav className="bottom-nav">
          <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><LayoutDashboard size={24} /><span>대시보드</span></div>
          <div className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}><History size={24} /><span>지출내역</span></div>
          <div className={`nav-item ${view === 'members' ? 'active' : ''}`} onClick={() => setView('members')}><Users size={24} /><span>팀원</span></div>
        </nav>
        <main style={{ flex: 1 }}>
          {view === 'dashboard' && <Dashboard selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} budgetInfo={budgetInfo} membersCount={members.length} onAddClick={() => setIsAdding(true)} />}
          {view === 'history' && <HistoryView expenses={expenses} members={members} onEditExpense={(exp) => { setNewExpense({ ...exp }); setIsAdding(true); }} />}
          {view === 'members' && <MembersView members={members} onEditMember={editMember} onAddMember={addMember} />}
        </main>
      </div>
      {isAdding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div className="fade-in" style={{ width: '100%', background: 'var(--bg-dark)', padding: '30px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            {!newExpense ? (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '20px' }}>지출 추가 방법 선택</h3>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <button className="btn" style={{ flex: 1, background: 'var(--bg-card)', height: '120px', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={() => fileInputRef.current.click()}><Camera size={32} color="var(--primary)" /><span>영수증 촬영</span></button>
                  <button className="btn" style={{ flex: 1, background: 'var(--bg-card)', height: '120px', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={handleManualAdd}><Plus size={32} color="var(--primary)" /><span>수동 입력</span></button>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" capture="environment" onChange={(e) => { handleFileUpload(e); e.target.value = ''; }} />
                <button className="btn" style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)' }} onClick={() => setIsAdding(false)}>취소</button>
              </div>
            ) : isProcessing ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div><p>분석 중...</p></div>
            ) : (
              <div className="fade-in">
                <h3 style={{ marginBottom: '20px' }}>내역 수정</h3>
                <label className="label">장소</label><input className="input-field" value={newExpense.store} onChange={e => setNewExpense({ ...newExpense, store: e.target.value })} />
                <label className="label">날짜</label><input className="input-field" type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
                <label className="label">금액</label><input className="input-field" type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: parseInt(e.target.value) || 0 })} />
                <label className="label">사용한 사람</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px' }}>
                  {members.map(m => (<div key={m.id} onClick={() => toggleUserSelection(m.id)} style={{ padding: '8px 16px', borderRadius: '20px', background: newExpense.users.includes(m.id) ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.9rem' }}>{m.name}</div>))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn" style={{ flex: 1, background: 'var(--bg-card)' }} onClick={() => setNewExpense(null)}>취소</button>
                  {expenses.some(e => e.id === newExpense.id) && <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white' }} onClick={() => deleteExpense(newExpense.id)}>삭제</button>}
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={saveExpense}>저장</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {isEditingLeader && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>팀장 이름 수정</h3>
            <label className="label">새 이름</label>
            <input className="input-field" value={leaderNameInput} onChange={e => setLeaderNameInput(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveLeaderName()} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setIsEditingLeader(false)}>취소</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveLeaderName}>저장</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; }`}</style>
    </div>
  );
}

export default App;
