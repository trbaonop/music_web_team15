const sunIcon = document.querySelector('.fa-sun');
  const gearIcon = document.querySelector('.fa-gear');

  // Khi click vào icon mặt trời -> bật / tắt dark mode
  sunIcon.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    // Đổi icon khi bật/tắt dark mode
    if (document.body.classList.contains('dark-mode')) {
      sunIcon.classList.remove('fa-sun');
      sunIcon.classList.add('fa-moon');
    } else {
      sunIcon.classList.remove('fa-moon');
      sunIcon.classList.add('fa-sun');
    }
  });

  // Click vào icon bánh răng (gear) mở cài đặt (tùy bạn thêm modal sau)
 

  