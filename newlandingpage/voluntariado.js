// --- Lógica de Interface e Menu Compartilhado ---
document.addEventListener('DOMContentLoaded', function() {
    
    // Controle do Menu Hambúrguer Mobile
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenu.classList.toggle('is-active');
            const bars = mobileMenu.querySelectorAll('.bar');
            if (mobileMenu.classList.contains('is-active')) {
                bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    }

    // Lógica visual para os botões de seleção de Turno
    const botoesTurno = document.querySelectorAll('.btn-turno');
    const inputTurno = document.getElementById('turnoSelecionado');

    if (botoesTurno && inputTurno) {
        botoesTurno.forEach(btn => {
            btn.addEventListener('click', function() {
                botoesTurno.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                inputTurno.value = this.getAttribute('data-turno');
            });
        });
    }
});

// Coloque abaixo o restante das suas funções originais de validação (ex: displayError, clearError, nome input checker, etc.)