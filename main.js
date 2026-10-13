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

// ==========================================================================
//          ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ТАБОВ ДЛЯ ЧЕК-ЛИСТА ЭКИПИРОВКИ
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.checklist-pane');

  if (tabButtons.length > 0 && tabPanes.length > 0) {
    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        const targetTab = this.getAttribute('data-tab');

        // 1. Убираем активный класс у всех кнопок и добавляем текущей
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        // 2. Скрываем все панели со списками вещей и показываем нужную
        tabPanes.forEach(pane => {
          pane.classList.remove('active');
          if (pane.getAttribute('id') === targetTab) {
            pane.classList.add('active');
          }
        });
      });
    });
  }
});


// ===========================================
//              ЦВЕТ СКРОЛЛ
// ===========================================

window.addEventListener('scroll', () => {
  const winScroll = document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.querySelector('.scroll-progress').style.width = scrolled + '%';
});


// ===============================
//       ИНДИКАТОР ВЫСОТЫ
// ===============================

document.addEventListener('scroll', function() {
  const bar = document.getElementById('altimeterBar');
  const pointer = document.getElementById('altimeterPointer');
  const numberDisplay = document.getElementById('altimeterCurrentNumber');
  
  // 1. Вычисляем процент прокрутки страницы
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  
  // Защита от деления на ноль, если страница не имеет прокрутки
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  
  // Ограничиваем в пределах от 0 до 100
  const boundedPercent = Math.min(Math.max(scrollPercent, 0), 100);
  
  // 2. Применяем процент к высоте шкалы и позиции маркера
  bar.style.height = boundedPercent + '%';
  pointer.style.bottom = boundedPercent + '%';
  
  // 3. Вычисляем текущую высоту в метрах
  // Мин. точки (старт) = 300м, Макс. точка (финиш) = 5642м
  const minHeight = 300;
  const maxHeight = 5642;
  
  const currentHeight = minHeight + ((maxHeight - minHeight) * (boundedPercent / 100));
  
  // Округляем до целого числа и выводим на экран
  numberDisplay.textContent = Math.round(currentHeight);
});

// ==============================
//        АНИМАЦИЯ ФОНА
// ==============================

(function () {
  const canvas = document.getElementById("mountain-mist-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Настройки эффекта
  const maxParticles = 60; // Количество частиц на экране (не перегружает систему)
  const particles = [];

  // Конструктор отдельной частицы (снежинки/микро-тумана)
  function Particle() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    // Делаем частицы разного размера для эффекта глубины (от 1 до 4 пикселей)
    this.radius = Math.random() * 3 + 1; 
    // Минимальная скорость падения вниз
    this.vy = Math.random() * 0.4 + 0.1; 
    // Легкое покачивание из стороны в сторону (ветер)
    this.vx = Math.random() * 0.2 - 0.1; 
    // Полупрозрачность в строгом стиле (от 0.05 до 0.3)
    this.opacity = Math.random() * 0.25 + 0.05; 
  }

  // Заполняем массив начальными частицами
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  // Главная функция отрисовки и анимации
  function render() {
    // Очищаем холст на каждом кадре
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < maxParticles; i++) {
      const p = particles[i];

      // Рисуем мягкую круглую частицу тумана
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      // Цвет строго черный (как элементы сайта), но за счет прозрачности он кажется серым дымом
      ctx.fillStyle = `rgba(0, 0, 0, ${p.opacity})`; 
      ctx.fill();

      // Обновляем координаты (движение)
      p.y += p.vy;
      p.x += p.vx;

      // Если частица улетела за нижний край — возвращаем её наверх
      if (p.y > height) {
        p.y = -10;
        p.x = Math.random() * width;
      }
      // Если улетела за боковые края — переносим на противоположную сторону
      if (p.x > width) p.x = 0;
      else if (p.x < 0) p.x = width;
    }

    // Рекурсивный вызов для плавных 60 кадров в секунду
    requestAnimationFrame(render);
  }

  // Корректно меняем размеры холста при изменении разрешения экрана
  window.addEventListener("resize", function () {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Запуск магии
  render();
})();
