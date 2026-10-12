// ==========================================================================
//                             ТЕЛЕФОН
// ==========================================================================
let isBackspace = false;

function saveBackspace(event) {
  isBackspace = (event.keyCode === 8 || event.keyCode === 46);
}

function formatPhoneNumber(input) {
  let matrix = input.value.replace(/\D/g, "");
  if (isBackspace && matrix.length <= 1) {
    input.value = "";
    return;
  }
  if (matrix.startsWith("8")) {
    matrix = "7" + matrix.substring(1);
  }

  let formatted = "+7";
  if (matrix.length > 1) formatted += " (" + matrix.substring(1, 4);
  if (matrix.length >= 4) formatted += ") ";
  if (matrix.length > 4) formatted += matrix.substring(4, 7);
  if (matrix.length >= 7) formatted += "-";
  if (matrix.length > 7) formatted += matrix.substring(7, 9);
  if (matrix.length >= 9) formatted += "-";
  if (matrix.length > 9) formatted += matrix.substring(9, 11);

  if (isBackspace) {
    if (formatted.endsWith("-")) formatted = formatted.slice(0, -1);
    else if (formatted.endsWith(") ")) formatted = formatted.slice(0, -2);
    else if (formatted.endsWith(" (")) formatted = formatted.slice(0, -2);
  }
  input.value = formatted;
}

// ==========================================================================
//                    ВАЛИДАЦИЯ ДАТЫ И КАСТОМНОЕ ОКНО
// ==========================================================================
function formatDateInput(input) {
  let matrix = input.value.replace(/\D/g, "");
  let formatted = "";
  if (matrix.length > 0) formatted += matrix.substring(0, 2);
  if (matrix.length >= 2) formatted += ".";
  if (matrix.length > 2) formatted += matrix.substring(2, 4);
  if (matrix.length >= 4) formatted += ".";
  if (matrix.length > 4) formatted += matrix.substring(4, 8);

  if (window.event && (window.event.inputType === 'deleteContentBackward')) {
    if (formatted.endsWith(".")) formatted = formatted.slice(0, -1);
  }
  input.value = formatted;
}

function showAlert(message) {
  const modal = document.getElementById('custom-alert');
  const modalMessage = document.getElementById('modal-message');
  if (modal && modalMessage) {
    modalMessage.innerText = message;
    modal.classList.add('active');
  }
}

function closeModal() {
  const modal = document.getElementById('custom-alert');
  if (modal) modal.classList.remove('active');
}

function validateRealDate(input) {
  if (input.value.length === 0) return;
  if (input.value.length < 10) {
    showAlert("Пожалуйста, введите дату полностью в формате ДД.ММ.ГГГГ");
    input.value = "";
    return;
  }

  const parts = input.value.split(".");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; 
  const year = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);

  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month || dateObj.getDate() !== day) {
    showAlert("Введена несуществующая дата! Проверьте количество дней в месяце.");
    input.value = "";
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) {
    showAlert("Нельзя выбрать прошедшую дату!");
    input.value = "";
    return;
  }
}

// ==========================================================================
//                        ВМАНИЦИЯ И МОДАЛКА
// ==========================================================================
window.addEventListener('load', function() {
  requestAnimationFrame(function() {
    // Анимация карточек
    const cards = document.querySelectorAll('.tour-card');
    const options = { root: null, rootMargin: '0px 0px 50px 0px', threshold: 0.05 };

    const observer = new IntersectionObserver(function (entries, observer) {
      let delay = 0;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${delay}s`;
          entry.target.classList.add('element-show');
          observer.unobserve(entry.target);
          delay += 0.1;
        }
      });
    }, options);

    cards.forEach(card => observer.observe(card));

    // Улучшение UX для модального окна
    const customAlert = document.getElementById('custom-alert');
    if (customAlert) {
      customAlert.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
      });
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });
  });
});

// ===================================================
//          УБРАТЬ СООБЩЕНИЕ О ПЕРЕЗАГРУЗКЕ
// ===================================================

document.addEventListener('DOMContentLoaded', function () {
  const bookingForm = document.querySelector('.booking-container form'); // Укажите селектор вашей формы

  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault(); // Намертво блокируем стандартную перезагрузку страницы браузером

      // Собираем данные из инпутов формы
      const formData = new FormData(bookingForm);

      // Отправляем данные на сервер в фоновом режиме
      fetch(bookingForm.action || 'send.php', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (response.ok) {
          showAlert("Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.");
          bookingForm.reset(); // Очищаем поля формы после успешной отправки
        } else {
          showAlert("Что-то пошло не так. Пожалуйста, попробуйте позже.");
        }
      })
      .catch(error => {
        console.error("Ошибка сети:", error);
        showAlert("Ошибка соединения с сервером.");
      });
    });
  }
});

// ==========================================================================
//                        КАЛЕНДАРЬ ДОСТУПНЫХ ДАТ
// ==========================================================================

document.addEventListener('DOMContentLoaded', function() {
  const dateInput = document.getElementById('booking-date');
  
  if (dateInput) {
    const today = new Date();
    
    // 1. Форматируем сегодняшнюю дату в формат ГГГГ-ММ-ДД для атрибута 'min'
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    
    // Устанавливаем минимальную дату — выбрать прошедшие дни теперь физически невозможно
    dateInput.min = minDate;

    // 2. Список полностью ЗАБЯТЫХ дат, на которые бронирование закрыто
    // Формат строго: ГГГГ-ММ-ДД (можно добавлять любые даты через запятую)
    const fullyBookedDates = [
      '2026-10-15', 
      '2026-10-16', 
      '2026-10-23'
    ];

    // Проверка при выборе даты пользователем
    dateInput.addEventListener('input', function() {
      if (fullyBookedDates.includes(this.value)) {
        // Если у вас в коде есть функция showAlert из прошлых шагов — используем её
        if (typeof showAlert === 'function') {
          showAlert("К сожалению, на эту дату все группы уже укомплектованы. Пожалуйста, выберите другой день!");
        } else {
          alert("К сожалению, на эту дату все группы уже укомплектованы. Пожалуйста, выберите другой день!");
        }
        this.value = ''; // Сбрасываем выбранное значение
      }
    });
  }
});
