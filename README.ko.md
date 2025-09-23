# SVG/EMF to PPTX 변환기

벡터 그래픽 품질을 유지하면서 SVG 및 EMF 파일을 PowerPoint 프레젠테이션으로 변환하는 현대적인 웹 애플리케이션입니다.

## 주요 기능

- **벡터 품질 보존**: 화질 손실 없이 SVG와 EMF 파일을 변환
- **다중 파일 지원**: 여러 파일을 업로드하여 하나의 PPTX 프레젠테이션 생성
- **드래그 앤 드롭 인터페이스**: 사용자 친화적인 파일 업로드 경험
- **다국어 지원**: 한국어, 영어, 일본어, 중국어(간체 및 번체) 지원
- **반응형 디자인**: 데스크톱과 모바일 기기에서 모두 작동
- **실시간 미리보기**: 변환 전 업로드된 파일 미리보기

## 지원 형식

- **입력**: SVG (.svg), EMF (.emf)
- **출력**: PowerPoint (.pptx)

## 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

### 설치

1. 저장소 복제:
```bash
git clone <repository-url>
cd ppt-converter
```

2. 의존성 설치:
```bash
npm install
```

3. 개발 서버 실행:
```bash
npm run dev
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 사용 방법

1. **파일 업로드**: SVG 또는 EMF 파일을 업로드 영역에 드래그 앤 드롭하거나 클릭하여 파일 선택
2. **미리보기**: 미리보기 섹션에서 업로드된 파일 확인
3. **변환**: "PPTX로 변환" 버튼을 클릭하여 프레젠테이션 생성
4. **다운로드**: 변환된 PPTX 파일이 자동으로 다운로드됨

## 기술 스택

- **프레임워크**: [Next.js 15](https://nextjs.org/) with App Router
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **국제화**: next-intl
- **파일 처리**: pptxgenjs, formidable
- **UI 컴포넌트**: React with react-dropzone

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── [locale]/          # 국제화된 라우트
│   ├── api/convert/       # 파일 변환 API 엔드포인트
│   └── globals.css        # 전역 스타일
├── components/            # 재사용 가능한 React 컴포넌트
├── i18n/                 # 국제화 설정
└── messages/             # 번역 파일
    ├── en.json           # 영어 번역
    ├── ko.json           # 한국어 번역
    ├── ja.json           # 일본어 번역
    ├── zh-CN.json        # 중국어 간체
    └── zh-TW.json        # 중국어 번체
```

## API

### POST /api/convert

업로드된 SVG/EMF 파일을 PPTX 형식으로 변환합니다.

**요청**: 파일 업로드를 포함한 Multipart form data
**응답**: PPTX 파일 다운로드

## 개발

### 사용 가능한 스크립트

- `npm run dev` - 개발 서버 시작
- `npm run build` - 프로덕션 빌드
- `npm start` - 프로덕션 서버 시작
- `npm run lint` - ESLint 실행

### 환경 변수

기본 기능 사용에는 환경 변수가 필요하지 않습니다.

## 기여하기

1. 저장소 포크
2. 기능 브랜치 생성
3. 변경사항 적용
4. 충분한 테스트
5. 풀 리퀘스트 제출

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 감사의 말

- [Next.js](https://nextjs.org/)로 구축
- [PptxGenJS](https://github.com/gitbrent/PptxGenJS)를 통한 PowerPoint 생성
- [react-dropzone](https://github.com/react-dropzone/react-dropzone)을 통한 파일 업로드 처리
- [next-intl](https://next-intl-docs.vercel.app/)을 통한 국제화

---

영어 문서는 [README.md](README.md)를 참조하세요.