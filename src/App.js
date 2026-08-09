import { isDemoMode } from "./lib/supabase";
import { subscribeFamilies } from "./services/familyService";
import { subscribeNominations } from "./services/nominationService";
import { getCampProfile } from "./services/campService";

// استيراد المكونات والصفحات
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Families from "./pages/Families";
import Nominations from "./pages/Nominations";
import Login from "./pages/Login";
import PrintPage from "./pages/PrintPage";
import DeveloperModal from "./components/DeveloperModal";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import SuperAdmin from "./pages/SuperAdmin";
import CampSettings from "./pages/CampSettings";
import AnnouncementBar from "./components/AnnouncementBar";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [families, setFamilies] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  // إعدادات المخيم النشط والاشتراك
  const [campProfile, setCampProfile] = useState(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // مراقبة حالة المصادقة (تسجيل الدخول)
  useEffect(() => {
    const savedUser = sessionStorage.getItem("kareem_camp_logged_in");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      localStorage.removeItem("kareem_camp_logged_in");
      setUser(null);
    }
    setLoading(false);
  }, []);

  // التحقق من حالة اشتراك المخيم عند تسجيل الدخول
  useEffect(() => {
    if (user && user.role !== "superadmin") {
      setCheckingSubscription(true);
      getCampProfile(user.campId).then((profile) => {
        setCampProfile(profile);
        if (profile) {
          const now = new Date();
          const expiry = new Date(profile.subscriptionExpiry);
          const isExpired = !profile.isActive || expiry < now;
          setIsSubscriptionExpired(isExpired);
        } else {
          setIsSubscriptionExpired(false);
        }
        setCheckingSubscription(false);
      });
    } else {
      setCampProfile(null);
      setIsSubscriptionExpired(false);
    }
  }, [user]);

  // جلب بيانات العائلات والترشيحات والاشتراك في التحديثات الفورية بعد تسجيل الدخول
  useEffect(() => {
    let unsubscribeFamilies;
    let unsubscribeNominations;

    if (user && user.role !== "superadmin") {
      unsubscribeFamilies = subscribeFamilies(user.campId, (data) => {
        setFamilies(data);
      });
      unsubscribeNominations = subscribeNominations(user.campId, (data) => {
        setNominations(data);
      });
    } else {
      setFamilies([]);
      setNominations([]);
    }

    return () => {
      if (unsubscribeFamilies) unsubscribeFamilies();
      if (unsubscribeNominations) unsubscribeNominations();
    };
  }, [user]);

  const handleLogout = async () => {
    sessionStorage.removeItem("kareem_camp_logged_in");
    localStorage.removeItem("kareem_camp_logged_in");
    setUser(null);
    setCampProfile(null);
    setIsSubscriptionExpired(false);
  };

  // مكون حماية المسارات (شرط تسجيل الدخول)
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // إذا كان المطور مسجل دخوله كـ Super Admin وحاول دخول مسار الإشراف العادي، يتم توجيهه للوحة تحكمه
    if (user.role === "superadmin") {
      return <Navigate to="/super-admin" replace />;
    }

    if (checkingSubscription) {
      return (
        <div className="loading-screen">
          <div className="spinner-large"></div>
          <p>جاري التحقق من صلاحية الاشتراك وتأمين البيانات...</p>
        </div>
      );
    }

    if (isSubscriptionExpired) {
      return (
        <SubscriptionExpired 
          user={user} 
          campProfile={campProfile} 
          onLogout={handleLogout} 
        />
      );
    }

    return (
      <>
        <Navbar user={user} campProfile={campProfile} onLogout={handleLogout} />
        <AnnouncementBar />
        <main className="main-content-layout">
          {children}
        </main>
        <footer className="app-footer no-print">
          <p>© 2026 م. إبراهيم مقبل - كافة الحقوق محفوظة</p>
          <p>
            تم تطوير الموقع بواسطة 
            <button onClick={() => setShowDeveloperModal(true)} className="developer-link-btn">
              م. إبراهيم مقبل
            </button>
          </p>
        </footer>
      </>
    );
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>جاري تحميل البيانات وتأمين الاتصال...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container" dir="rtl">
        <Routes>
          {/* مسار تسجيل الدخول */}
          <Route 
            path="/login" 
            element={
              user ? (
                user.role === "superadmin" ? <Navigate to="/super-admin" replace /> : <Navigate to="/" replace />
              ) : (
                <Login setUser={setUser} />
              )
            } 
          />

          {/* مسار لوحة تحكم المطور الرئيسي */}
          <Route 
            path="/super-admin" 
            element={
              user && user.role === "superadmin" ? (
                <SuperAdmin user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* مسار لوحة التحكم الرئيسي للمخيم */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard families={families} nominations={nominations} user={user} campProfile={campProfile} />
              </ProtectedRoute>
            } 
          />

          {/* مسار إدارة العائلات */}
          <Route 
            path="/families" 
            element={
              <ProtectedRoute>
                <Families families={families} user={user} campProfile={campProfile} />
              </ProtectedRoute>
            } 
          />

          {/* مسار إدارة الترشيحات */}
          <Route 
            path="/nominations" 
            element={
              <ProtectedRoute>
                <Nominations nominations={nominations} user={user} campProfile={campProfile} />
              </ProtectedRoute>
            } 
          />

          {/* مسار إدارة المخيم */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <CampSettings user={user} campProfile={campProfile} setCampProfile={setCampProfile} />
              </ProtectedRoute>
            } 
          />

          {/* مسار الطباعة المخصص */}
          <Route path="/print" element={<PrintPage />} />

          {/* إعادة توجيه أي مسار خاطئ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {showDeveloperModal && (
          <DeveloperModal onClose={() => setShowDeveloperModal(false)} />
        )}
      </div>
    </Router>
  );
}

export default App;
