//팝업 창에서 조직도 데이터 로드 및 클릭 이벤트 처리
document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:8080/rest/admin/api/sync/emp') // API 엔드포인트, 필요 시 적절한 주소로 변경
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById('employeeList');
            data.forEach(emp => {
                const item = document.createElement('div');
                item.textContent = `${emp.name} (${emp.email})`;
                item.className = 'employee';
                item.addEventListener('click', () => {
                    chrome.runtime.sendMessage({ action: 'insertEmail', email: emp.email });
                    window.close();
                });
                list.appendChild(item);
            });
        })
        .catch(error => console.error('데이터 로드 실패', error));
});
