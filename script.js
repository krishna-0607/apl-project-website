document.addEventListener("DOMContentLoaded", () => {
    const PROD_API_BASE = window.APL_API_BASE || "https://apl-backend.onrender.com";
    const LOCAL_API_BASE = "http://localhost:3000";
    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const API_BASE = isLocalHost ? LOCAL_API_BASE : PROD_API_BASE;
    const CHAT_API_ENDPOINT = `${API_BASE}/api/chat`;
    const ENQUIRY_API_ENDPOINT = `${API_BASE}/api/enquiry`;
    const BACKEND_SLEEP_HINT = "Server may be waking up on free hosting. Please wait 20-40 seconds and try again.";
    const siteNav = document.getElementById("siteNav");
    const heroSection = document.getElementById("home");
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.querySelectorAll(".nav-links a");
    const backToTop = document.getElementById("backToTop");
    const scrollProgress = document.getElementById("scrollProgress");
    const revealItems = document.querySelectorAll(".reveal");
    const counters = document.querySelectorAll(".counter");

    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxClose = document.getElementById("lightboxClose");
    const zoomableImages = document.querySelectorAll(".component-card img, .gallery-item img");
    const tiltCards = document.querySelectorAll(".tilt-card");

    const sliderTrack = document.getElementById("sliderTrack");
    const slidePrev = document.getElementById("slidePrev");
    const slideNext = document.getElementById("slideNext");
    const mediaSlider = document.getElementById("mediaSlider");

    const hardwareTrack = document.getElementById("hardwareTrack");
    const hardwarePrev = document.getElementById("hardwarePrev");
    const hardwareNext = document.getElementById("hardwareNext");
    const hardwareDots = document.getElementById("hardwareDots");

    const chatbotToggle = document.getElementById("chatbotToggle");
    const chatbotPanel = document.getElementById("chatbotPanel");
    const chatbotClose = document.getElementById("chatbotClose");
    const chatbotForm = document.getElementById("chatbotForm");
    const chatbotText = document.getElementById("chatbotText");
    const chatbotMessages = document.getElementById("chatbotMessages");

    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("form-status");

    const textTargets = document.querySelectorAll(".hero h1, .hero-lead, .section-head h2, .hardware-copy h3, .hardware-copy p");

    const animateText = (node) => {
        if (!node || node.dataset.animated === "true") {
            return;
        }

        const original = node.textContent.trim();
        if (!original) {
            return;
        }

        node.dataset.animated = "true";
        node.classList.add("text-slide");
        const words = original.split(/\s+/);
        node.textContent = "";

        words.forEach((word, index) => {
            const span = document.createElement("span");
            span.className = "word";
            span.style.animationDelay = `${Math.min(index * 0.04, 0.48)}s`;
            span.textContent = word;
            node.appendChild(span);
        });
    };

    textTargets.forEach((target) => animateText(target));

    if (menuToggle && siteNav) {
        menuToggle.addEventListener("click", () => {
            siteNav.classList.toggle("open");
        });
    }

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const targetId = link.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                siteNav.classList.remove("open");
            }
        });
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.14 });

    revealItems.forEach((item) => revealObserver.observe(item));

    const countUp = (element) => {
        const target = Number(element.dataset.target || 0);
        let value = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const timer = setInterval(() => {
            value += step;
            if (value >= target) {
                value = target;
                clearInterval(timer);
            }
            element.textContent = value;
        }, 24);
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                countUp(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach((counter) => counterObserver.observe(counter));

    if (sliderTrack && mediaSlider) {
        const sliderItems = sliderTrack.querySelectorAll(".gallery-item");
        let currentIndex = 0;
        let visibleCount = window.innerWidth <= 760 ? 1 : 3;

        const getItemWidth = () => {
            const first = sliderItems[0];
            if (!first) {
                return 0;
            }
            const style = window.getComputedStyle(sliderTrack);
            const gap = parseFloat(style.gap || "0");
            return first.getBoundingClientRect().width + gap;
        };

        const renderSlide = () => {
            const itemWidth = getItemWidth();
            sliderTrack.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
        };

        const maxIndex = () => Math.max(0, sliderItems.length - visibleCount);

        const stepNext = () => {
            currentIndex = currentIndex >= maxIndex() ? 0 : currentIndex + 1;
            renderSlide();
        };

        const stepPrev = () => {
            currentIndex = currentIndex <= 0 ? maxIndex() : currentIndex - 1;
            renderSlide();
        };

        if (slideNext) {
            slideNext.addEventListener("click", stepNext);
        }

        if (slidePrev) {
            slidePrev.addEventListener("click", stepPrev);
        }

        let autoSlide = setInterval(stepNext, 3800);
        mediaSlider.addEventListener("mouseenter", () => clearInterval(autoSlide));
        mediaSlider.addEventListener("mouseleave", () => {
            autoSlide = setInterval(stepNext, 3800);
        });

        window.addEventListener("resize", () => {
            visibleCount = window.innerWidth <= 760 ? 1 : 3;
            if (currentIndex > maxIndex()) {
                currentIndex = maxIndex();
            }
            renderSlide();
        });

        renderSlide();
    }

    if (hardwareTrack) {
        const hardwareSlides = Array.from(hardwareTrack.querySelectorAll(".hardware-slide"));
        let hardwareIndex = 0;
        let hardwareDirection = 1;
        let hardwareTimer;

        const renderHardware = () => {
            hardwareTrack.style.transform = `translateX(-${hardwareIndex * 100}%)`;
            hardwareSlides.forEach((slide, index) => {
                slide.classList.toggle("is-active", index === hardwareIndex);
            });

            if (hardwareDots) {
                const dots = hardwareDots.querySelectorAll(".hardware-dot");
                dots.forEach((dot, index) => {
                    dot.classList.toggle("active", index === hardwareIndex);
                });
            }
        };

        const stepHardware = () => {
            const maxIndex = hardwareSlides.length - 1;

            if (hardwareIndex >= maxIndex) {
                hardwareDirection = -1;
            } else if (hardwareIndex <= 0) {
                hardwareDirection = 1;
            }

            hardwareIndex += hardwareDirection;
            renderHardware();
        };

        const restartHardwareTimer = () => {
            clearInterval(hardwareTimer);
            hardwareTimer = setInterval(stepHardware, 4300);
        };

        if (hardwareDots) {
            hardwareSlides.forEach((_, index) => {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.className = "hardware-dot";
                dot.setAttribute("aria-label", `Show hardware slide ${index + 1}`);
                dot.addEventListener("click", () => {
                    hardwareDirection = index >= hardwareIndex ? 1 : -1;
                    hardwareIndex = index;
                    renderHardware();
                    restartHardwareTimer();
                });
                hardwareDots.appendChild(dot);
            });
        }

        if (hardwareNext) {
            hardwareNext.addEventListener("click", () => {
                hardwareDirection = 1;
                hardwareIndex = (hardwareIndex + 1) % hardwareSlides.length;
                renderHardware();
                restartHardwareTimer();
            });
        }

        if (hardwarePrev) {
            hardwarePrev.addEventListener("click", () => {
                hardwareDirection = -1;
                hardwareIndex = hardwareIndex <= 0 ? hardwareSlides.length - 1 : hardwareIndex - 1;
                renderHardware();
                restartHardwareTimer();
            });
        }

        const hardwareCarousel = document.getElementById("hardwareCarousel");
        if (hardwareCarousel) {
            hardwareCarousel.addEventListener("mouseenter", () => clearInterval(hardwareTimer));
            hardwareCarousel.addEventListener("mouseleave", restartHardwareTimer);
        }

        renderHardware();
        restartHardwareTimer();
    }

    tiltCards.forEach((card) => {
        card.addEventListener("mousemove", (event) => {
            const bounds = card.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;
            const rotateY = ((x / bounds.width) - 0.5) * 14;
            const rotateX = (0.5 - (y / bounds.height)) * 12;
            card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });

    zoomableImages.forEach((image) => {
        image.addEventListener("click", () => {
            lightboxImage.src = image.src;
            lightboxImage.alt = image.alt;
            lightbox.classList.add("show");
            lightbox.setAttribute("aria-hidden", "false");
        });
    });

    const closeLightbox = () => {
        lightbox.classList.remove("show");
        lightbox.setAttribute("aria-hidden", "true");
        lightboxImage.src = "";
    };

    if (lightboxClose && lightbox) {
        lightboxClose.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && lightbox.classList.contains("show")) {
            closeLightbox();
        }
    });

    const setActiveLink = () => {
        const y = window.scrollY + 120;
        navLinks.forEach((link) => {
            const section = document.querySelector(link.getAttribute("href"));
            if (!section) {
                return;
            }

            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            if (y >= top && y < bottom) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    };

    const toggleFlowVideoVisibility = () => {
        if (!heroSection) {
            return;
        }

        const threshold = Math.max(120, heroSection.offsetHeight - 140);
        document.body.classList.toggle("show-flow-video", window.scrollY > threshold);
    };

    window.addEventListener("scroll", () => {
        if (backToTop) {
            backToTop.style.display = window.scrollY > 400 ? "flex" : "none";
        }

        if (scrollProgress) {
            const scrollTop = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            scrollProgress.style.width = `${Math.min(progress, 100)}%`;
        }

        const parallax = Math.min(window.scrollY * 0.08, 26);
        document.body.style.backgroundPosition = `center ${parallax}px, center 0, center 0`;
        setActiveLink();
        toggleFlowVideoVisibility();
    });

    toggleFlowVideoVisibility();

    if (backToTop) {
        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (chatbotToggle && chatbotPanel) {
        chatbotToggle.addEventListener("click", () => {
            const shouldShow = !chatbotPanel.classList.contains("show");
            chatbotPanel.classList.toggle("show", shouldShow);
            chatbotPanel.setAttribute("aria-hidden", shouldShow ? "false" : "true");
        });
    }

    if (chatbotClose && chatbotPanel) {
        chatbotClose.addEventListener("click", () => {
            chatbotPanel.classList.remove("show");
            chatbotPanel.setAttribute("aria-hidden", "true");
        });
    }

    const appendMessage = (text, role) => {
        if (!chatbotMessages) {
            return;
        }
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${role}`;
        bubble.textContent = text;
        chatbotMessages.appendChild(bubble);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    };

    if (chatbotForm && chatbotText && chatbotMessages) {
        chatbotForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const message = chatbotText.value.trim();
            if (!message) {
                return;
            }

            appendMessage(message, "user");
            chatbotText.value = "";

            const endpoint = CHAT_API_ENDPOINT;
            if (!endpoint) {
                appendMessage("Chat API endpoint is not configured.", "bot");
                return;
            }

            appendMessage("Typing...", "bot");
            const typingNode = chatbotMessages.lastElementChild;

            const timeoutMs = 12000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message
                    }),
                    signal: controller.signal
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.error || `Request failed: ${response.status}`);
                }

                const finalReply = (data?.reply || "").trim();
                if (!finalReply) {
                    throw new Error("API returned an empty reply.");
                }

                if (typingNode && typingNode.parentElement) {
                    typingNode.remove();
                }
                appendMessage(finalReply, "bot");
            } catch (error) {
                if (typingNode && typingNode.parentElement) {
                    typingNode.remove();
                }
                if (error.name === "AbortError") {
                    appendMessage(`Chat request timed out. ${BACKEND_SLEEP_HINT}`, "bot");
                } else if (/Failed to fetch|NetworkError|fetch/i.test(error.message)) {
                    if (isLocalHost) {
                        appendMessage("Unable to reach local chat server at http://localhost:3000. Start backend with npm start and try again.", "bot");
                    } else {
                        appendMessage(`Unable to reach backend. ${BACKEND_SLEEP_HINT}`, "bot");
                    }
                } else {
                    appendMessage(`Backend API error: ${error.message}. ${BACKEND_SLEEP_HINT}`, "bot");
                }
            } finally {
                clearTimeout(timeoutId);
            }
        });
    }

    if (contactForm && formStatus) {
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !email || !message) {
                formStatus.style.color = "#ff9595";
                formStatus.textContent = "Please complete all fields before sending.";
                return;
            }

            formStatus.style.color = "#3dd4ff";
            formStatus.textContent = "Sending your enquiry...";

            try {
                const response = await fetch(ENQUIRY_API_ENDPOINT, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        message
                    })
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.error || `Request failed with status ${response.status}`);
                }

                formStatus.style.color = "#3dd4ff";
                formStatus.textContent = `Thanks ${name}. Your enquiry was sent successfully.`;
                contactForm.reset();
            } catch (error) {
                formStatus.style.color = "#ff9595";
                if (/Failed to fetch|NetworkError|fetch|timeout/i.test(error.message)) {
                    formStatus.textContent = `Unable to send enquiry. ${BACKEND_SLEEP_HINT}`;
                } else {
                    formStatus.textContent = `Unable to send enquiry: ${error.message}`;
                }
            }
        });
    }

    setActiveLink();
});