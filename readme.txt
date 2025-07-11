# 홈피: 구글 스프레드시트 기반 웹사이트

홈피 프로젝트에 오신 것을 환영합니다! 이 프로젝트는 구글 스프레드시트를 백엔드 데이터베이스로 사용하는 간단하고 사용자 정의 가능한 웹사이트 템플릿을 제공합니다. 즉, 복잡한 서버 프로그래밍 없이 구글 스프레드시트에서 직접 웹사이트 콘텐츠(블로그 게시물, 방명록/채팅룸, 동맹 목록 등)를 관리할 수 있습니다. 이 사이트는 GitHub Pages에서 쉽게 호스팅할 수 있도록 설계되었습니다.

이 README는 자신만의 홈피 인스턴스를 설정하는 방법을 안내합니다.

---

## 1. 준비물

시작하기 전에 다음을 준비하세요:
* 구글 계정 (구글 스프레드시트 및 구글 앱스 스크립트용)
* GitHub 계정 (웹사이트 호스팅용)

---

## 2. 구글 앱스 스크립트 설정 (웹사이트의 백엔드)

홈피 사이트는 구글 스프레드시트에서 데이터를 읽고 쓰기 위해 구글 앱스 스크립트를 사용합니다. 스크립트를 웹 애플리케이션으로 배포해야 합니다.

1.  새 구글 시트 만들기:
    * https://docs.google.com/spreadsheets/d/1dUZxV8aKMFL__Sp05aKAIWr-iWi4E7zb5QNlxQjt8Sc/edit?usp=sharing 
    * 위 시트의 사본을 만들어주세요. 사본을 만들 때, Apps Script 파일 및 기능도 함께 복사하는 것이 맞습니다. 
    * 확장 프로그램 > Apps Script를 열어 Apps Script를 확인해주세요. 
    * 가장 위에 스프레드시트ID파트를 본인의 스프레드시트 ID로 바꿔주세요. ID는 웹 URL에서 스프레드시트의 ID를 찾을 수 있습니다. 예를 들면 https://docs.google.com/spreadsheets/d/ SPREADSHEET_ID /edit#gid=0

2.  **웹 앱으로 배포:**
    * 앱스 스크립트 편집기에서 `배포` 버튼(오른쪽 상단)을 클릭하고 `새 배포`를 선택합니다.
    * `유형`에서 `웹 앱`을 선택합니다.
    * **구성:**
        * `다음을 실행`: `나` (귀하의 구글 계정)를 선택합니다.
        * `액세스 권한`: `누구나`를 선택합니다. (웹사이트가 스크립트에 액세스하는 데 매우 중요합니다.)
    * `배포`를 클릭합니다.
    * 구글에서 스크립트 승인을 요청할 수 있습니다. 필요한 권한을 부여하려면 안내를 따르세요.
    * 배포가 완료되면 `웹 앱 URL`을 받게 됩니다. **이 URL을 복사하세요.** 다음 단계에서 필요합니다.

---

## 3. 웹사이트와 앱스 스크립트 연결

앱스 스크립트가 배포되었으므로 이제 웹사이트에 앱스 스크립트를 찾을 위치를 알려주어야 합니다.

1.  **`js/utils.js` 열기:**
    * 로컬 프로젝트 파일에서 `hompy/js/utils.js`로 이동합니다.

2.  **`APPS_SCRIPT_URL` 업데이트:**
    * 다음 줄을 찾습니다: `export const APPS_SCRIPT_URL`
    * **링크를 2단계 5번에서 복사한 `웹 앱 URL`로 바꿉니다.**
    * `utils.js` 파일을 저장합니다.

---

## 4. 동맹 목록 설정 (선택 사항)

나만의 동맹 목록을 사용할 계획이라면, "Alliances" 구글 시트를 CSV로 게시해야 합니다.

1.  **"Alliances" 구글 시트 준비:**
    * https://docs.google.com/spreadsheets/d/1sNdc_if13XEivMOyPeEAUsJyN95mxa4aBI0ChqJJO-4/edit?usp=sharing 의 사본을 만듭니다.
    * 동맹 데이터를 입력합니다.

2.  **CSV로 웹에 게시:**
    * "Alliances" 구글 시트에서 `파일 > 공유 > 웹에 게시`로 이동합니다.
    * `링크` 아래에서 "Alliances" 시트를 선택합니다.
    * `형식`에서 `쉼표로 구분된 값(.csv)`을 선택합니다.
    * `게시`를 클릭합니다.
    * **생성된 URL을 복사합니다.**

3.  **`listofalliance.html`에서 `CSV_URL` 업데이트:**
    * `hompy/contents/html/listofalliance.html`을 엽니다.
    * 다음 줄을 찾습니다: `const CSV_URL = 'YOUR_CSV_URL_HERE';`
    * **`'YOUR_CSV_URL_HERE'`를 4단계 2번에서 복사한 CSV URL로 바꿉니다.**
    * `listofalliance.html` 파일을 저장합니다.

---

## 5. GitHub Pages에 사이트 게시

GitHub Pages는 GitHub 저장소를 웹사이트로 게시하는 무료 호스팅 서비스입니다.

1.  **새 GitHub 저장소 만들기:**
    * GitHub(github.com)로 이동하여 로그인합니다.
    * `New`를 클릭하여 새 저장소를 만듭니다.
    * 이름을 지정합니다 (예: `hompy` 또는 `my-website`).
    * `Public`을 선택합니다.
    * 아직 README 파일이나 `.gitignore`를 추가하지 **마십시오**.
    * `Create repository`를 클릭합니다.

2.  **파일 업로드:**
    * 새 저장소 페이지에서 `uploading an existing file`을 클릭합니다.
    * `css/`, `js/`, `contents/`, `index.html` 등 모든 하위 폴더를 포함하여 `hompy/` 폴더 전체를 업로드 영역으로 끌어다 놓습니다.
    * 변경 사항을 커밋합니다.

3.  **GitHub Pages 구성:**
    * 파일이 업로드되면 저장소의 `Settings` 탭으로 이동합니다.
    * 왼쪽 사이드바에서 `Pages`를 클릭합니다.
    * `Build and deployment` 아래의 `Source`에서 `Deploy from a branch`를 선택합니다.
    * `Branch`에서 기본 브랜치(일반적으로 `main` 또는 `master`)를 선택하고 `/(root)` 폴더를 선택합니다.
    * `Save`를 클릭합니다.

4.  **웹사이트 접속:**
    * GitHub Pages가 이제 사이트를 빌드하고 배포합니다. 몇 분 정도 걸릴 수 있습니다.
    * 배포가 완료되면 `Pages` 설정 페이지에 웹사이트의 URL이 나타납니다 (예: `https://your-username.github.io/your-repository-name/`).

---

## 6. 비개발자를 위한 사용자 정의 팁

* **콘텐츠 편집:**
    * **메인 페이지 (`index.html`):** 사이트의 기본 정보를 위해 `<title>` 및 `<meta name="description">` 태그를 변경합니다.
    * **정보 페이지 (`contents/html/about.html`):** `<p>` 태그 내의 텍스트 내용을 직접 편집하여 "About Me" 섹션을 사용자 정의합니다.
    * **유튜브 배경 (`main.html`):** 배경 비디오를 변경하려면 `hompy/main.html`을 열고 `videoId: '-JhoMGoAfFc'`를 찾으세요. `-JhoMGoAfFc`를 원하는 유튜브 비디오의 ID로 바꿉니다.

* **스타일링 (기본):**
    * **`css/style.css`:** 이 파일에는 전역 스타일 및 CSS 변수(예: `--color-primary`, `--font-primary`)가 포함되어 있습니다. 과감하게 색상의 `rgb()` 값이나 글꼴 이름을 변경해 볼 수 있습니다. 편집하기 전에 항상 백업을 만드세요!
    * **`css/chatroom.css` 및 `css/components.css`:** 이 파일들은 채팅룸이나 내비게이션과 같은 특정 요소의 스타일을 정의합니다. `font-size`나 `padding` 값과 같은 간단한 변경은 가능하지만, 더 복잡한 속성은 주의하세요.

* **구글 스프레드시트 관리:**
    * 사이트의 동적 콘텐츠(게시물, 채팅, 동맹)를 업데이트하는 가장 쉬운 방법은 구글 스프레드시트를 직접 편집하는 것입니다. 열 이름과 순서를 수정하지 마세요.

---

이 가이드가 홈피 사이트를 시작하고 관리하는 데 도움이 되기를 바랍니다! 특정 문제가 발생하는 경우 브라우저 개발자 콘솔에서 오류를 확인하는 것을 고려해 보세요.