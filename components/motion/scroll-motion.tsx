"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal]";
const STAGGER_SELECTOR = "[data-stagger]";
const PARALLAX_SELECTOR = "[data-parallax]";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * محرك حركات خفيف للموقع العام والمتاجر.
 *
 * يعتمد على خصائص data-* بدل مكتبة حركات كاملة:
 * - data-reveal="up | inline-start | inline-end | scale"
 * - data-stagger على الحاوية لترتيب ظهور العناصر التابعة تلقائيًا
 * - data-parallax="12" لحركة تمرير بسيطة (بالبكسل)
 *
 * لا تتغير أبعاد أي عنصر أثناء الحركة؛ نستخدم opacity و transform فقط،
 * لذلك لا ينتج عن الحركات أي Layout Shift.
 */
export default function ScrollMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY);

    if (reduceMotion.matches) {
      root.classList.remove("motion-enabled");
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
        element.classList.add("is-revealed", "is-motion-settled");
      });
      return;
    }

    // توجد إضافة مبكرة لهذه الفئة داخل <head> لمنع وميض المحتوى قبل hydration.
    // هذا السطر احتياط للتنقلات أو المتصفحات التي تؤخر تنفيذ السكربت المبكر.
    root.classList.add("motion-enabled");

    // احتياط للمتصفحات القديمة: يبقى كل المحتوى ظاهرًا وقابلًا للاستخدام.
    if (typeof IntersectionObserver === "undefined") {
      root.classList.remove("motion-enabled");
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
        element.classList.add("is-revealed", "is-motion-settled");
      });
      return;
    }

    const settleTimers = new Set<number>();
    const parallaxElements = new Set<HTMLElement>();
    const registeredRevealElements = new WeakSet<HTMLElement>();

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const element = entry.target as HTMLElement;
          revealObserver.unobserve(element);
          element.classList.add("is-revealed");

          const order = Number(element.dataset.motionOrder ?? 0);
          const timer = window.setTimeout(() => {
            element.classList.add("is-motion-settled");
            settleTimers.delete(timer);
          }, 620 + Math.min(order, 8) * 65);
          settleTimers.add(timer);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    const assignStaggerOrder = (element: HTMLElement) => {
      const group = element.closest<HTMLElement>(STAGGER_SELECTOR);
      if (!group) return;

      // نحسب عناصر أقرب مجموعة فقط، حتى لا تختلط مجموعة داخلية بمجموعة الأب.
      const peers = Array.from(group.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)).filter(
        (peer) => peer.closest(STAGGER_SELECTOR) === group
      );
      const order = Math.max(0, peers.indexOf(element));
      element.dataset.motionOrder = String(order);
      element.style.setProperty("--motion-order", String(Math.min(order, 8)));
    };

    const registerReveal = (element: HTMLElement) => {
      if (registeredRevealElements.has(element)) return;
      registeredRevealElements.add(element);
      assignStaggerOrder(element);
      revealObserver.observe(element);
    };

    const registerTree = (node: ParentNode) => {
      if (node instanceof HTMLElement) {
        if (node.matches(REVEAL_SELECTOR)) registerReveal(node);
        if (node.matches(PARALLAX_SELECTOR)) parallaxElements.add(node);
      }
      node.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach(registerReveal);
      node.querySelectorAll<HTMLElement>(PARALLAX_SELECTOR).forEach((element) => {
        parallaxElements.add(element);
      });
    };

    registerTree(document);

    let parallaxFrame = 0;
    const updateParallax = () => {
      parallaxFrame = 0;
      if (reduceMotion.matches) return;
      const viewportHeight = window.innerHeight || 1;
      const mobileFactor = window.innerWidth < 768 ? 0.6 : 1;

      for (const element of parallaxElements) {
        if (!element.isConnected) {
          parallaxElements.delete(element);
          continue;
        }

        const rect = element.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > viewportHeight + 80) continue;

        const requested = Number(element.dataset.parallax ?? 12);
        const strength = Math.max(-24, Math.min(24, Number.isFinite(requested) ? requested : 12));
        const centerDistance = viewportHeight / 2 - (rect.top + rect.height / 2);
        const normalized = Math.max(-1, Math.min(1, centerDistance / viewportHeight));
        const offset = normalized * strength * mobileFactor;
        element.style.setProperty("--motion-parallax-y", `${offset.toFixed(2)}px`);
      }
    };

    const requestParallaxUpdate = () => {
      if (parallaxFrame) return;
      parallaxFrame = window.requestAnimationFrame(updateParallax);
    };

    window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
    window.addEventListener("resize", requestParallaxUpdate, { passive: true });
    requestParallaxUpdate();

    // يدعم العناصر التي تظهر لاحقًا، مثل بطاقات المنتجات بعد تغيير الفلتر.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) registerTree(node);
        });
      }
      requestParallaxUpdate();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      root.classList.remove("motion-enabled");
      revealObserver.disconnect();
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
        element.classList.add("is-revealed", "is-motion-settled");
      });
      parallaxElements.forEach((element) => {
        element.style.setProperty("--motion-parallax-y", "0px");
      });
    };
    reduceMotion.addEventListener("change", handleMotionPreference);

    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
      reduceMotion.removeEventListener("change", handleMotionPreference);
      window.removeEventListener("scroll", requestParallaxUpdate);
      window.removeEventListener("resize", requestParallaxUpdate);
      if (parallaxFrame) window.cancelAnimationFrame(parallaxFrame);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return null;
}
