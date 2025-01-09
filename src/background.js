let popupWindowId = null;

// 확장프로그램이 설치되거나 업데이트될 때 실행
chrome.runtime.onInstalled.addListener(() => {
    console.log('조직도 확장프로그램이 설치/업데이트 되었습니다.');
});

// content script나 팝업으로부터의 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('백그라운드에서 메시지 수신:', request);

    // 조직도 팝업 열기 요청 처리
    if (request.action === "openOrgTree") {
        if (popupWindowId !== null) {
            chrome.windows.remove(popupWindowId, () => {
                console.log("이전 팝업 창 닫음");
            });
        }

        const popupWidth = 400;
        const popupHeight = 600;

        chrome.windows.create({
            url: chrome.runtime.getURL('src/popup/popup.html'),
            type: 'popup',
            width: popupWidth,
            height: popupHeight,
            focused: true
        }, (window) => {
            if (chrome.runtime.lastError) {
                console.error('팝업 창 생성 실패:', chrome.runtime.lastError.message);
                return;
            }else {
                console.log('조직도 팝업이 열렸습니다.');
                popupWindowId = window.id; // 팝업 창 ID 저장
            }
        });
    }

    // 이메일 삽입 요청 처리
    if (request.action === "insertEmail") {
        console.log('이메일 삽입 요청 받음:', request.email);

        // 현재 활성화된 탭 찾기
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs[0]) {
                console.error('활성 탭을 찾을 수 없습니다.');
                sendResponse({ error: '활성 탭을 찾을 수 없습니다.' });
                return;
            }

            console.log('활성 탭 ID:', tabs[0].id);

            // content script로 메시지 전송
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    action: "insertEmail",
                    email: request.email
                },
                (response) => {
                    console.log('content script 응답:', response);
                    if (chrome.runtime.lastError) {
                        console.error('컨텐츠 스크립트 메시지 전송 실패:', chrome.runtime.lastError);
                        sendResponse({ error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse(response);
                    }
                }
            );
        });

        return true; // 비동기 응답을 위해 필요
    }
});

