import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Super Blog',
  description: 'Super Blog 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-black text-black mb-8 bg-neo-blue inline-block px-4 py-2 border-4 border-black shadow-hard text-white">
        개인정보처리방침
      </h1>
      <div className="bg-white border-4 border-black shadow-hard p-8 space-y-6 font-bold text-black leading-relaxed">
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">수집하는 정보</h2>
          <p>본 서비스는 회원가입 없이 이용 가능하며, 별도의 개인정보를 수집하지 않습니다. 다만 서비스 개선을 위해 방문 패턴, CTA 클릭 이벤트 등의 익명 통계 정보를 수집합니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">쿠키 및 외부 서비스</h2>
          <p>쿠팡 파트너스 링크 클릭 시 쿠팡의 개인정보처리방침이 적용됩니다. 본 서비스는 쿠팡의 쿠키 정책에 따라 제휴 추적 쿠키가 설정될 수 있습니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">문의</h2>
          <p>개인정보 관련 문의사항은 GitHub Issues를 통해 접수해주세요.</p>
        </section>
        <p className="text-sm text-gray-600 border-t-2 border-black pt-4">시행일: 2026년 3월 1일</p>
      </div>
    </div>
  );
}
