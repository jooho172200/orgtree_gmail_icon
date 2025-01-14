let popupWindowId = null;

// content script나 popup script으로부터의 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('백그라운드에서 메시지 수신:', request);

    // 요청된 action에 따라 해당하는 처리 함수 호출
    switch (request.action) {
        case "openOrgTree":
            // 조직도 팝업 열기 요청 처리
            handleOpenOrgTree();
            break;

        case "insertEmailToPopup":
            // 이메일 삽입 요청 처리
            handleInsertEmailToPopup(request, sendResponse);
            return true; // 비동기 응답을 위해 true 반환 (sendResponse가 비동기일 경우 필요)

        case "closePopup":
            // 조직도 팝업 닫기 요청 처리
            handleClosePopup();
            break;

        default:
            console.warn('알 수 없는 액션:', request.action);
            break;
    }
});//chrome.runtime.onMessage.addListener

//조직도 팝업을 여는 함수
function handleOpenOrgTree() {
    if (popupWindowId !== null) {
        chrome.windows.remove(popupWindowId, () => {
            console.log("이전 팝업 창 닫음");
        });
    }

    const popupWidth = 400;
    const popupHeight = 600;

    //새로운 팝업 창 생성
    chrome.windows.create({
        url: chrome.runtime.getURL('src/popup/popup.html'), // 팝업에 로드할 HTML 파일
        type: 'popup',
        width: popupWidth,
        height: popupHeight,
        focused: true
    }, (window) => {
        if (chrome.runtime.lastError) {
            console.error('팝업 창 생성 실패:', chrome.runtime.lastError.message);
            return;
        }
        console.log('조직도 팝업이 열렸습니다.');
        popupWindowId = window.id;
    });
}

// Gmail 메일쓰기 탭에 선택한 이메일을 삽입하는 함수
function handleInsertEmailToPopup(request, sendResponse) {
    console.log('이메일 삽입 요청 받음:', request.email);

    // Gmail 메일쓰기 탭을 찾기 위해 쿼리 실행
    chrome.tabs.query({ url: '*://mail.google.com/*' }, (tabs) => {
        if (tabs.length === 0) {
            console.error('Gmail 메일쓰기 탭을 찾을 수 없습니다.');
            sendResponse({ error: 'Gmail 메일쓰기 탭을 찾을 수 없습니다.' });
            return;
        }

        //첫 번째로 찾은 Gmail 메일쓰기 탭의 ID를 가져옴
        const gmailTabId = tabs[0].id;
        console.log('Gmail 메일쓰기 탭 ID:', gmailTabId);

        // 찾은 Gmail 탭에 메시지를 전송하여 이메일 삽입 요청
        chrome.tabs.sendMessage(
            gmailTabId,
            {
                action: "insertEmail",  //메일 삽입 액션
                email: request.email    //삽입할 이메일 주소
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('메시지 전송 중 오류:', chrome.runtime.lastError.message);
                    sendResponse({ error: chrome.runtime.lastError.message });
                    return;
                }
                console.log('Gmail에 이메일 삽입 성공:', response);
                sendResponse({ success: true });
            }
        );
    });
}

// 선택 후 조직도 팝업 창을 닫는 함수
function handleClosePopup() {
    if (popupWindowId !== null) {
        chrome.windows.remove(popupWindowId, () => {
            console.log("팝업 창이 닫혔습니다.");
            popupWindowId = null;
        });
    }
}


