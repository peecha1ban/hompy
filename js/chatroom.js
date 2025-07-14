// js/chatroom.js (방명록(채팅방) 스크립트)

// hompy/js/chatroom.js
import { APPS_SCRIPT_URL, escapeHTML } from './utils.js'; // escapeHTML 추가

// DOMContentLoaded 이벤트: HTML 문서가 완전히 로드되고 파싱되면 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
    // HTML 요소들을 JavaScript 변수에 연결합니다.
    const usernameInput = document.getElementById('username-input'); // 닉네임 입력 필드
    const ageInput = document.getElementById('age-input'); // 나이 입력 필드
    const locationInput = document.getElementById('location-input'); // 지역 입력 필드
    const messageInput = document.getElementById('message-input'); // 메시지 입력 필드
    const sendMessageButton = document.getElementById('send-message-button'); // 메시지 전송 버튼
    const messagesDisplay = document.getElementById('messages-display'); // 메시지 표시 영역
    const chatroomContent = document.getElementById('chatroom-content'); // 채팅방 스크롤 컨테이너
    const rightPanel = document.querySelector('.right-panel');

    const honeypotField = document.getElementById('hp_email'); // NEW: 스팸 방지를 위한 허니팟 필드

    const chatroomContainer = document.getElementById('chatroom-container'); // 방명록 전체 컨테이너
    const chatroomHeader = document.getElementById('chatroom-header'); // 방명록 헤더
    const toggleButton = document.getElementById('toggle-button'); // 방명록 열기/닫기 토글 버튼
    const chatroomHeaderTitle = document.getElementById('chatroom-header-title'); // 방명록 헤더 제목
    const infoDiv = document.querySelector('.info'); // 사용자 정보 입력 필드 컨테이너

    // 현재 사용자 정보를 저장할 객체
    let currentUser = {
        username: '',
        age: '',
        location: '',
        colorClass: '' // 사용자에 할당된 색상 CSS 클래스
    };

    let lastDisplayedDate = ''; // 날짜 구분선을 관리하기 위한 마지막으로 표시된 날짜
    let isChatOpen = false; // 채팅방 열림/닫힘 상태를 관리하는 플래그
    let lastFetchedTimestamp = 0; // NEW: 마지막으로 성공적으로 가져온 메시지의 타임스탬프 (초기값 0)
    let displayedMessageIds = new Set();

    // 사용자 메시지 색상 목록
    const userColors = [
        'user-color-0', 'user-color-1', 'user-color-2',
        'user-color-3', 'user-color-4', 'user-color-5'
    ];
    let colorMap = new Map(); // 사용자 이름과 할당된 색상을 매핑하는 Map 객체

    // --- 모든 사용자 데이터를 로컬 스토리지에 저장하는 함수 ---
    function saveUserData() {
        const userData = {
            username: usernameInput.value.trim(),
            age: ageInput.value.trim(),
            location: locationInput.value.trim(),
            colorClass: currentUser.colorClass
        };
        // 닉네임, 나이, 지역이 모두 입력되었을 때만 저장합니다.
        if (userData.username && userData.age && userData.location) {
            localStorage.setItem('chat_user_data', JSON.stringify(userData));
        } else {
            // 하나라도 비어있으면 저장된 데이터 삭제
            localStorage.removeItem('chat_user_data');
        }
    }

    // --- 모든 사용자 데이터를 로컬 스토리지에서 불러오는 함수 ---
    function loadUserData() {
        const storedData = localStorage.getItem('chat_user_data'); // 저장된 데이터 가져오기
        if (storedData) {
            try {
                return JSON.parse(storedData); // JSON 파싱하여 반환
            } catch (e) {
                console.error("Error parsing stored user data:", e);
                localStorage.removeItem('chat_user_data'); // 파싱 오류 시 데이터 삭제
                return null;
            }
        }
        return null; // 저장된 데이터가 없으면 null 반환
    }

    // --- 이벤트 리스너 ---
    // 방명록 헤더 클릭 시 채팅방 열고 닫기
    chatroomHeader.addEventListener('click', (event) => {
        // 입력 필드 클릭이 아닐 때만 토글
        if (chatroomHeader.contains(event.target) && event.target !== usernameInput && event.target !== ageInput && event.target !== locationInput) {
            toggleChatroom();
        }
    });
    
    // 사용자 정보 입력 필드(닉네임, 나이, 지역) 변경 시 이벤트 리스너
    usernameInput.addEventListener('change', handleUserInfoChange);
    ageInput.addEventListener('change', handleUserInfoChange);
    locationInput.addEventListener('change', handleUserInfoChange);

    /**
     * 사용자 정보 변경 시 호출되는 핸들러 함수
     */
    function handleUserInfoChange() {
        assignUserColor(); // 사용자 색상 할당
        currentUser.username = usernameInput.value.trim(); // 현재 사용자 닉네임 업데이트
        currentUser.age = ageInput.value.trim(); // 현재 사용자 나이 업데이트
        currentUser.location = locationInput.value.trim(); // 현재 사용자 지역 업데이트
        currentUser.colorClass = colorMap.get(currentUser.username) || ''; // 할당된 색상 클래스 가져오기
        saveUserData(); // 변경된 사용자 정보 저장
        checkAndHideInfoDiv(); // 정보 입력창 숨김 여부 확인
    }

    // 메시지 전송 버튼 클릭 시 이벤트 리스너
    sendMessageButton.addEventListener('click', sendChatMessage); 
    // 메시지 입력 필드에서 'Enter' 키 눌렀을 때 이벤트 리스너
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendChatMessage();
        }
    });

    // --- 사용자 색상 할당 함수 ---
    function assignUserColor() {
        const username = usernameInput.value.trim();
        // 닉네임이 있고 아직 색상이 할당되지 않았으면 새로운 색상 할당
        if (username && !colorMap.has(username)) {
            const assignedColor = userColors[colorMap.size % userColors.length]; // 색상 목록에서 순서대로 할당
            colorMap.set(username, assignedColor); // Map에 닉네임-색상 매핑 저장
        }
    }

    // --- 정보 입력창 숨김 여부 확인 함수 ---
    function checkAndHideInfoDiv() {
        // 닉네임, 나이, 지역이 모두 입력되었으면 정보 입력창 숨김
        if (usernameInput.value.trim() && ageInput.value.trim() && locationInput.value.trim()) {
           infoDiv.classList.add('hidden');
        } else {
            // 하나라도 비어있으면 정보 입력창 표시
            infoDiv.classList.remove('hidden');
         }
     }

    // --- 채팅방 토글 함수 (열기/닫기) ---
    function toggleChatroom() {
        if (isChatOpen) { // 채팅방이 열려 있으면
            chatroomContainer.classList.remove('open'); // 'open' 클래스 제거하여 닫기
            chatroomHeaderTitle.textContent = '방명록'; // 헤더 제목 변경
        } else { // 채팅방이 닫혀 있으면
            chatroomContainer.classList.add('open'); // 'open' 클래스 추가하여 열기
            
            // 현재 사용자 정보 업데이트
            currentUser.username = usernameInput.value.trim();
            currentUser.age = ageInput.value.trim();
            currentUser.location = locationInput.value.trim();
            
            assignUserColor(); // 사용자 색상 할당 (다시 확인)
            currentUser.colorClass = colorMap.get(currentUser.username) || ''; // 할당된 색상 클래스 가져오기

            // 닉네임이 있으면 환영 메시지 표시, 없으면 '방명록' 표시
            if (currentUser.username) {
                chatroomHeaderTitle.textContent = `${currentUser.username}님 환영합니다~!`;
            } else {
                chatroomHeaderTitle.textContent = '방명록';
            }
            // 채팅방 내용을 맨 아래로 스크롤
            chatroomContent.scrollTop = chatroomContent.scrollHeight;
        }
        isChatOpen = !isChatOpen; // 상태 토글
    }

    // --- 채팅 메시지 전송 함수 (commentManager.js의 sendComment에서 파생) ---
    async function sendChatMessage() {
        const username = usernameInput.value.trim();
        const message = messageInput.value.trim();
        const age = ageInput.value.trim();
        const location = locationInput.value.trim();
        const hpEmail = honeypotField.value.trim(); // NEW: 허니팟 필드 값 가져오기

        // 허니팟 필드에 값이 있으면 스팸으로 간주하고 중단합니다.
        if (hpEmail !== '') {
            console.warn("Honeypot triggered, likely spam attempt.");
            return;
        }

        // 닉네임, 나이, 지역 중 하나라도 비어있으면 경고 메시지 표시
        if (!username || !age || !location) {
            alert('닉네임, 나이, 지역을 모두 입력해주세요!');
            return;
        }

        // 메시지 내용이 비어있으면 경고 메시지 표시
        if (!message) {
            alert("메시지를 입력해주세요!");
            return;
        }

        // 메시지 전송 버튼 비활성화 및 투명도 조절 (중복 클릭 방지 및 시각적 피드백)
        sendMessageButton.disabled = true;
        sendMessageButton.style.opacity = '0.5';

        // 현재 사용자 정보 업데이트 및 저장
        currentUser.username = username;
        currentUser.age = age;
        currentUser.location = location;
        assignUserColor();
        currentUser.colorClass = colorMap.get(currentUser.username);
        saveUserData(); 
        checkAndHideInfoDiv(); 

        try {
            // FormData 객체를 사용하여 메시지 데이터를 준비합니다.
            const formData = new FormData();
            formData.append('action', 'addComment'); // Apps Script의 'addComment' 함수 호출
            formData.append('username', username);
            formData.append('message', message);
            formData.append('age', age); // NEW: 나이 전송
            formData.append('location', location); // NEW: 지역 전송

            // Apps Script로 POST 요청을 보냅니다.
            const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
            // 응답이 성공적이지 않으면 오류 발생
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json(); // 응답을 JSON으로 파싱

            if (result.success) {
                messageInput.value = ''; // 메시지 입력 필드 초기화
                // NEW: 메시지 전송 성공 시 전체 메시지를 다시 가져오는 대신, 새로운 메시지만 추가되도록 변경
                // Apps Script에서 모든 메시지를 다시 가져와서 화면 업데이트
                await fetchChatMessages(true); // true를 전달하여 모든 메시지를 다시 가져오도록 합니다.
                // 메시지가 추가된 후 맨 아래로 스크롤 (비동기 렌더링 고려하여 setTimeout 사용)
                setTimeout(() => {
                    chatroomContent.scrollTop = chatroomContent.scrollHeight;
                }, 0); 
            } else {
                console.error(`Error: ${result.error || 'Failed to add message.'}`);
                alert(`Error: ${result.error || 'Failed to add message.'}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        } finally {
            // 메시지 전송 완료 후 버튼 활성화 및 투명도 복원
            sendMessageButton.disabled = false;
            sendMessageButton.style.opacity = '1';
        }
    }

    // --- 채팅 메시지 가져오기 함수 (commentManager.js의 fetchComments에서 파생) ---
    // NEW: `reset` 매개변수를 추가하여 전체 메시지를 다시 로드할지, 아니면 새로운 메시지만 추가할지 결정합니다.
    async function fetchChatMessages(reset = false) {
        if (!messagesDisplay) {
            console.error("Messages display not initialized. Cannot fetch messages.");
            return;
        }
        try {
            // NEW: 마지막으로 가져온 타임스탬프를 쿼리 파라미터로 추가합니다.
            // reset이 true이면 lastTimestamp를 0으로 설정하여 모든 메시지를 가져옵니다.
            const timestampParam = reset ? 0 : lastFetchedTimestamp;
            const response = await fetch(`${APPS_SCRIPT_URL}?action=getComments&lastTimestamp=${timestampParam}`); 
            // 응답이 성공적이지 않으면 오류 발생
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const messages = await response.json(); // 응답을 JSON으로 파싱
            console.log(messages);

            // Apps Script에서 오류 응답이 왔을 경우 처리
            if (messages.success === false) {
                console.error("Error from Apps Script (getComments for chat):", messages.error);
                messagesDisplay.innerHTML = '<div class="chat-message">방명록을 읽어올 수 없습니다.</div>';
                return;
            }

            // NEW: reset이 true일 경우에만 기존 메시지를 모두 지웁니다.
            if (reset) {
                messagesDisplay.innerHTML = ''; 
                lastDisplayedDate = ''; // 날짜 구분선 관리를 위해 날짜 초기화
                displayedMessageIds.clear();
            }

            // NEW: 가져온 메시지가 없거나 배열이 아니면 추가적인 처리를 건너뜁니다.
            if (!Array.isArray(messages) || messages.length === 0) {
                 if (reset) { // reset이 true이고 메시지가 없으면 "글 없음" 메시지 표시
                     messagesDisplay.innerHTML = '<div class="chat-message">그 누구도 글을 남겨주징 않았네...</div>';
                 }
                return; // 새로운 메시지가 없으면 함수 종료
            } else {
                // NEW: 가져온 메시지 중 가장 최신 타임스탬프를 업데이트합니다.
                const latestTimestamp = messages.reduce((maxTs, msg) => {
                    const msgTimestamp = new Date(msg.timestamp).getTime();
                    return msgTimestamp > maxTs ? msgTimestamp : maxTs;
                }, lastFetchedTimestamp); // 현재 lastFetchedTimestamp보다 큰 값만 찾습니다.
                if (latestTimestamp > lastFetchedTimestamp) {
                    lastFetchedTimestamp = latestTimestamp;
                }
                console.log('Updated lastFetchedTimestamp to:', lastFetchedTimestamp);

                // 각 메시지를 순회하며 화면에 표시합니다.
                messages.forEach(msg => {
                    const messageUniqueId = `${msg.timestamp}-${msg.username}-${msg.message}`; //유니크 ID 생성
                    // NEW: Check if the message is already displayed
                if (displayedMessageIds.has(messageUniqueId)) {
                    // console.log(`Skipping duplicate message: ${msg.message}`); // For debugging
                    return; // Skip this message as it's already in the DOM
                }
                    const now = new Date(msg.timestamp); // Apps Script에서 받은 타임스탬프 사용
                    const currentDate = now.toISOString().split('T')[0]; // 'YYYY-MM-DD' 형식의 날짜
                    const currentTime = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); // 'HH:MM' 형식의 시간

                    // 날짜가 변경되면 날짜 구분선 표시
                    // NEW: lastDisplayedDate는 이전에 화면에 표시된 마지막 메시지의 날짜와 비교하여 구분선을 그립니다.
                    // reset이 아닌 경우, 즉 새로운 메시지를 추가하는 경우에는 이 로직이 중요합니다.
                    if (currentDate !== lastDisplayedDate) {
                        displayDateDivider(now);
                        lastDisplayedDate = currentDate;
                    }

                    // 가져온 데이터의 사용자 이름에 따라 색상 할당 (아직 할당되지 않았다면)
                    if (msg.username && !colorMap.has(msg.username)) {
                         const assignedColor = userColors[colorMap.size % userColors.length];
                         colorMap.set(msg.username, assignedColor);
                    }
                    const msgColorClass = colorMap.get(msg.username) || ''; // 메시지 사용자 색상 클래스

                    // 메시지 HTML 요소를 생성하여 추가합니다.
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('chat-message');
                    messageElement.innerHTML = `
                        <span class="timestamp">${currentTime}</span> <strong class="${msgColorClass}">${escapeHTML(msg.username || '')}(${escapeHTML(msg.age || '')}/${escapeHTML(msg.location || '')}):</strong> ${escapeHTML(msg.message || '')} `;
                    messagesDisplay.appendChild(messageElement);
                    displayedMessageIds.add(messageUniqueId);
                });
                // 메시지 로드 후 맨 아래로 스크롤
                setTimeout(() => {
                    chatroomContent.scrollTop = chatroomContent.scrollHeight;
                }, 0);            
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            // NEW: 초기 로드 실패 시 또는 전체 로드 실패 시에만 에러 메시지 표시
            if (reset) {
                messagesDisplay.innerHTML = '<div class="chat-message">Failed to load messages.</div>';
            }
        }
    }

    // --- 날짜 구분선 표시 함수 ---
    function displayDateDivider(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`; // 'YYYY-MM-DD' 형식

        const dividerElement = document.createElement('div');
        dividerElement.classList.add('date-divider'); // CSS 클래스 추가
        dividerElement.innerHTML = `<span>${formattedDate}</span>`; // 날짜 텍스트 삽입
        messagesDisplay.appendChild(dividerElement); // 메시지 영역에 구분선 추가
    }

    // --- 초기 로드 로직 ---
    const loadedData = loadUserData(); // 로컬 스토리지에서 사용자 데이터 불러오기
    if (loadedData) {
        // 불러온 데이터로 입력 필드 채우기
        usernameInput.value = loadedData.username || '';
        ageInput.value = loadedData.age || '';
        locationInput.value = loadedData.location || '';
        
        // currentUser 객체 업데이트
        currentUser.username = loadedData.username || '';
        currentUser.age = loadedData.age || '';
        currentUser.location = loadedData.location || '';
        currentUser.colorClass = loadedData.colorClass || '';
        // Map에 닉네임-색상 매핑 저장
        if (currentUser.username && currentUser.colorClass) {
            colorMap.set(currentUser.username, currentUser.colorClass);
        }
    }
    checkAndHideInfoDiv(); // 페이지 로드 시 정보 입력창 숨김 여부 확인

    // NEW: 초기 로드 시에는 모든 메시지를 가져오도록 fetchChatMessages(true) 호출
    fetchChatMessages(true); 
    // NEW: 주기적인 업데이트는 이제 새로운 메시지만 가져오도록 lastFetchedTimestamp를 활용합니다.
    // fetchChatMessages(false)는 lastFetchedTimestamp 이후의 메시지만 요청합니다.
    setInterval(() => fetchChatMessages(false), 30000); 

    isChatOpen = false; // 채팅방 초기 상태를 '닫힘'으로 설정
});