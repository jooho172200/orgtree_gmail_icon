//팝업 창에서 조직도 데이터 로드 및 클릭 이벤트 처리
// document.addEventListener('DOMContentLoaded', () => {

    // fetch('http://localhost:2734/rest/admin/api/sync/employees') // API 엔드포인트, 필요 시 적절한 주소로 변경
    //     .then(response => response.json())
    //     .then(data => {
    //         console.log('API 응답 데이터:', data); // 데이터 구조 확인
    //         const list = document.getElementById('employeeList');
    //         data.forEach(emp => {
    //             const item = document.createElement('div');
    //             item.textContent = `${emp.empNm} (${emp.email})`;
    //             item.className = 'employee';
    //             item.addEventListener('click', () => {
    //                 console.log(`선택한 이메일: ${emp.email}`); // 선택한 이메일 확인용
    //                 chrome.runtime.sendMessage({ action: 'insertEmailToPopup', email: emp.email });
    //                 //chrome.runtime.sendMessage({ action: 'closePopup' }); // 팝업 창 닫기 요청
    //             });
    //             list.appendChild(item);
    //         });
    //     })
    //     .catch(error => console.error('데이터 로드 실패', error));
// });

//팝업 창에서 조직도 데이터 로드 및 클릭 이벤트 처리
document.addEventListener('DOMContentLoaded', () => {
    const orgTreeUrl = "http://localhost:8090/admin/emp/empMasterListView.do"; // 조직도 URL

    // iframe으로 조직도 뷰를 로드
    const container = document.getElementById('org-tree-container');
    container.innerHTML = `
        <iframe src="${orgTreeUrl}" style="width:100%; height:600px; border:none;"></iframe>
    `;
});

