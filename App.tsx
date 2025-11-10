import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CourseGrid } from './components/CourseGrid';
import { MapSection } from './components/MapSection';
import { About } from './components/About';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { CourseDetail } from './components/CourseDetail';
import { MyPage } from './components/MyPage';
import { AdminPage } from './components/AdminPage';
import { Community } from './components/Community';
import { ReviewModal } from './components/ReviewModal';
import { QRScanModal } from './components/QRScanModal';
import { BadgeModal } from './components/BadgeModal';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Course, User, Review, Badge } from './types';
import { mockCourses, mockReviews, mockBadges, mockCourseRankings, mockGlobalRanking } from './data/mockData';
import './styles/globals.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'courses' | 'map' | 'about' | 'community' | 'mypage' | 'admin'>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isQRScanModalOpen, setIsQRScanModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [completedCourses, setCompletedCourses] = useState<number[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  // 로그인/회원가입 처리
  const handleAuth = (email: string, password: string, nickname?: string, region?: string) => {
    if (authMode === 'signup' && nickname && region) {
      const newUser: User = {
        id: Date.now(),
        email,
        nickname,
        region,
        joinDate: new Date().toISOString(),
        totalDistance: 0,
        completedCourses: [],
        badges: []
      };
      setCurrentUser(newUser);
      toast.success('회원가입이 완료되었습니다!');
    } else {
      // 로그인 (목업)
      const user: User = {
        id: 1,
        email,
        nickname: nickname || '갈맷길러',
        region: region || '부산진구',
        joinDate: '2024-01-01T00:00:00Z',
        totalDistance: 125.5,
        completedCourses: [1, 3, 5],
        badges: [mockBadges[0], mockBadges[1]]
      };
      setCurrentUser(user);
      setCompletedCourses(user.completedCourses);
      setBadges(user.badges);
      toast.success('로그인되었습니다!');
    }
    setIsAuthModalOpen(false);
  };

  // 소셜 로그인 처리
  const handleSocialLogin = (provider: 'kakao' | 'naver') => {
    const user: User = {
      id: Date.now(),
      email: `user@${provider}.com`,
      nickname: `${provider}사용자`,
      region: '부산진구',
      joinDate: new Date().toISOString(),
      totalDistance: 0,
      completedCourses: [],
      badges: []
    };
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    toast.success(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인이 완료되었습니다!`);
  };

  // 로그아웃
  const handleLogout = () => {
    setCurrentUser(null);
    setFavorites([]);
    setCompletedCourses([]);
    setBadges([]);
    setCurrentPage('home');
    toast.success('로그아웃되었습니다.');
  };

  // 찜하기 토글
  const toggleFavorite = (courseId: number) => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    setFavorites(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
    
    const isFavorited = !favorites.includes(courseId);
    toast.success(isFavorited ? '코스를 찜했습니다!' : '찜을 해제했습니다.');
  };

  // 리뷰 작성
  const handleReviewSubmit = (rating: number, content: string, photos: File[]) => {
    if (!currentUser || !selectedCourse) return;

    const newReview: Review = {
      id: Date.now(),
      courseId: selectedCourse.id,
      userId: currentUser.id,
      userName: currentUser.nickname,
      rating,
      content,
      photos: photos.map((_, index) => `photo-${Date.now()}-${index}.jpg`),
      date: new Date().toISOString(),
      likes: 0
    };

    setReviews(prev => [newReview, ...prev]);
    setIsReviewModalOpen(false);
    toast.success('리뷰가 작성되었습니다!');

    // 리뷰 작성 뱃지 체크
    const userReviewCount = reviews.filter(r => r.userId === currentUser.id).length + 1;
    if (userReviewCount === 1) {
      const firstReviewBadge = mockBadges.find(b => b.id === 4);
      if (firstReviewBadge && !badges.find(b => b.id === firstReviewBadge.id)) {
        setBadges(prev => [...prev, firstReviewBadge]);
        setNewBadge(firstReviewBadge);
        setIsBadgeModalOpen(true);
      }
    }
  };

  // QR 스캔 완주 인증
  const handleQRScan = () => {
    if (!currentUser || !selectedCourse) return;

    if (!completedCourses.includes(selectedCourse.id)) {
      setCompletedCourses(prev => [...prev, selectedCourse.id]);
      
      // 거리 업데이트
      const newTotalDistance = (currentUser.totalDistance || 0) + selectedCourse.distance;
      setCurrentUser(prev => prev ? { ...prev, totalDistance: newTotalDistance } : null);
      
      toast.success(`${selectedCourse.name} 완주 인증이 완료되었습니다!`);
      
      // 뱃지 체크
      checkForNewBadges(completedCourses.length + 1, newTotalDistance);
    } else {
      toast.info('이미 완주한 코스입니다.');
    }
    
    setIsQRScanModalOpen(false);
  };

  // 뱃지 획득 체크
  const checkForNewBadges = (completedCount: number, totalDistance: number) => {
    const newBadges: Badge[] = [];

    // 첫 완주 뱃지
    if (completedCount === 1) {
      const firstCompletionBadge = mockBadges.find(b => b.id === 1);
      if (firstCompletionBadge && !badges.find(b => b.id === firstCompletionBadge.id)) {
        newBadges.push(firstCompletionBadge);
      }
    }

    // 5코스 완주 뱃지
    if (completedCount >= 5) {
      const fiveCourseBadge = mockBadges.find(b => b.id === 2);
      if (fiveCourseBadge && !badges.find(b => b.id === fiveCourseBadge.id)) {
        newBadges.push(fiveCourseBadge);
      }
    }

    // 50km 완주 뱃지
    if (totalDistance >= 50) {
      const distanceBadge = mockBadges.find(b => b.id === 3);
      if (distanceBadge && !badges.find(b => b.id === distanceBadge.id)) {
        newBadges.push(distanceBadge);
      }
    }

    if (newBadges.length > 0) {
      setBadges(prev => [...prev, ...newBadges]);
      setNewBadge(newBadges[0]);
      setIsBadgeModalOpen(true);
    }
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const openCourseDetail = (course: Course) => {
    setSelectedCourse(course);
  };

  const closeCourseDetail = () => {
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        currentUser={currentUser}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onAuthClick={openAuth}
        onLogout={handleLogout}
      />
      
      {currentPage === 'home' && (
        <>
          <Hero onAuthClick={openAuth} />
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="mb-8 text-center text-3xl font-bold">인기 코스</h2>
              <CourseGrid 
                courses={courses.slice(0, 6)}
                favorites={favorites}
                completedCourses={completedCourses}
                onCourseClick={openCourseDetail}
                onFavoriteClick={toggleFavorite}
                currentUser={currentUser}
              />
            </div>
          </section>
        </>
      )}

      {currentPage === 'courses' && (
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h1 className="mb-8 text-center text-4xl font-bold">전체 갈맷길 코스</h1>
            <CourseGrid 
              courses={courses}
              favorites={favorites}
              completedCourses={completedCourses}
              onCourseClick={openCourseDetail}
              onFavoriteClick={toggleFavorite}
              currentUser={currentUser}
            />
          </div>
        </section>
      )}

      {currentPage === 'map' && (
        <MapSection 
          courses={courses}
          favorites={favorites}
          completedCourses={completedCourses}
          onCourseClick={openCourseDetail}
          onFavoriteClick={toggleFavorite}
          currentUser={currentUser}
        />
      )}

      {currentPage === 'about' && <About />}

      {currentPage === 'community' && (
        <Community
          courses={courses}
          reviews={reviews}
          currentUser={currentUser}
          badges={badges}
          completedCourses={completedCourses}
          courseRankings={mockCourseRankings}
          globalRanking={mockGlobalRanking}
          onCourseClick={openCourseDetail}
        />
      )}

      {currentPage === 'mypage' && currentUser && (
        <MyPage 
          user={currentUser}
          courses={courses}
          reviews={reviews}
          badges={badges}
          favorites={favorites}
          completedCourses={completedCourses}
          onCourseClick={openCourseDetail}
          onUserUpdate={setCurrentUser}
        />
      )}

      {currentPage === 'admin' && (
        <AdminPage 
          courses={courses}
          onCoursesUpdate={setCourses}
        />
      )}

      {/* 코스 상세 모달 */}
      {selectedCourse && (
        <CourseDetail
          course={selectedCourse}
          reviews={reviews.filter(r => r.courseId === selectedCourse.id)}
          isFavorited={favorites.includes(selectedCourse.id)}
          isCompleted={completedCourses.includes(selectedCourse.id)}
          currentUser={currentUser}
          onClose={closeCourseDetail}
          onFavoriteClick={() => toggleFavorite(selectedCourse.id)}
          onReviewClick={() => setIsReviewModalOpen(true)}
          onQRScanClick={() => setIsQRScanModalOpen(true)}
        />
      )}

      {/* 인증 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAuth}
        onSocialLogin={handleSocialLogin}
        onModeChange={setAuthMode}
      />

      {/* 리뷰 작성 모달 */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        courseName={selectedCourse?.name || ''}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />

      {/* QR 스캔 모달 */}
      <QRScanModal
        isOpen={isQRScanModalOpen}
        courseName={selectedCourse?.name || ''}
        onClose={() => setIsQRScanModalOpen(false)}
        onScan={handleQRScan}
      />

      {/* 뱃지 획득 모달 */}
      <BadgeModal
        isOpen={isBadgeModalOpen}
        badge={newBadge}
        onClose={() => setIsBadgeModalOpen(false)}
      />

      <Footer />

      <Toaster />
    </div>
  );
}