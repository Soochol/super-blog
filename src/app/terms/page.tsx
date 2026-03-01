import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | Super Blog',
  description: 'Super Blog 이용약관',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-black text-black mb-8 bg-neo-yellow inline-block px-4 py-2 border-4 border-black shadow-hard">
        이용약관
      </h1>
      <div className="bg-white border-4 border-black shadow-hard p-8 space-y-6 font-bold text-black leading-relaxed">
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제1조 (목적)</h2>
          <p>본 약관은 Super Blog(이하 "서비스")의 이용 조건 및 절차, 운영자와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제2조 (서비스 내용)</h2>
          <p>서비스는 노트북 스펙 비교, AI 리뷰 제공, 쿠팡 파트너스 제휴 링크를 통한 최저가 안내를 제공합니다. 제품 가격 및 스펙 정보는 변경될 수 있으며, 실제 구매 전 공식 사이트에서 확인하시기 바랍니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제3조 (제휴 마케팅)</h2>
          <p>본 서비스는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 이는 구매자에게 추가 비용을 발생시키지 않습니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제4조 (면책)</h2>
          <p>서비스는 정보 제공 목적으로 운영되며, 제품 구매 결과에 대한 책임을 지지 않습니다.</p>
        </section>
        <p className="text-sm text-gray-600 border-t-2 border-black pt-4">시행일: 2026년 3월 1일</p>
      </div>
    </div>
  );
}
