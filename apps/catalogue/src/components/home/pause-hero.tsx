"use client"

import { Link } from "next-view-transitions"
import { useRef } from "react"
import { formatBdt, type CatalogueProduct, type SiteSettings } from "@dtc/catalogue-core"
import { onSiteReady } from "@/components/motion/preloader"
import { Picture } from "@/components/ui/picture"
import { EASE_OUT, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap"

interface MenuItem {
  href: string
  label: string
  hint: string
}

/**
 * The home page opens on a game pause screen: the featured photo sits
 * blurred behind a PAUSED title and a pause menu. Scrolling resumes the game:
 * the blur clears and the photo comes into focus.
 */
export function PauseHero({ product, settings, productCount }: { product: CatalogueProduct | null; settings: SiteSettings; productCount: number }) {
  const root = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)

  const backdrop = product?.images.find((i) => i.role === "model") ?? product?.images[0]
  const cover = product?.images.find((i) => i.role === "front") ?? product?.images[0]

  const menu: MenuItem[] = [
    { href: "#featured", label: "Resume", hint: "Continue" },
    { href: "#collection", label: "Collection", hint: `${productCount} ${productCount === 1 ? "item" : "items"}` },
    { href: "#how-to-order", label: "How to order", hint: "WhatsApp / Messenger" },
    { href: "#faq", label: "FAQ", hint: "Delivery, sizes" },
  ]

  const moveIndicator = (target: HTMLElement) => {
    if (!indicator.current) return
    gsap.to(indicator.current, { y: target.offsetTop, height: target.offsetHeight, duration: 0.45, ease: EASE_OUT })
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.set("[data-intro]", { autoAlpha: 0 })
        gsap.set("[data-char]", { yPercent: 110 })

        const intro = gsap
          .timeline({ paused: true, defaults: { ease: EASE_OUT } })
          .fromTo("[data-backdrop]", { scale: 1.25 }, { scale: 1.1, duration: 2 }, 0)
          .to("[data-char]", { yPercent: 0, duration: 1.1, stagger: 0.05 }, 0.1)
          .fromTo("[data-pause-bar]", { scaleY: 0 }, { scaleY: 1, duration: 0.8, stagger: 0.1 }, 0.2)
          .to("[data-intro]", { autoAlpha: 1, duration: 0.01 }, 0.35)
          .from("[data-intro]", { y: 30, duration: 1, stagger: 0.07 }, 0.35)
          .fromTo("[data-cover]", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.2 }, 0.5)
        const stopWaiting = onSiteReady(() => intro.play())

        // Scroll to resume.
        const status = root.current?.querySelector<HTMLElement>("[data-status]")
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=80%",
              pin: true,
              scrub: 0.6,
              onUpdate: (self) => {
                if (status) status.textContent = self.progress > 0.55 ? "Resumed" : "Game paused"
              },
            },
          })
          .to("[data-blur]", { opacity: 0, ease: "none" }, 0)
          .to("[data-veil]", { opacity: 0.25, ease: "none" }, 0)
          .to("[data-backdrop]", { scale: 1, ease: "none" }, 0)
          .to("[data-paused]", { yPercent: -40, opacity: 0, ease: "none" }, 0)
          .to("[data-menu]", { x: -40, opacity: 0, ease: "none" }, 0)
          .to("[data-hero-copy]", { y: -40, opacity: 0, ease: "none" }, 0.05)
          .to("[data-hero-foot]", { opacity: 0, ease: "none" }, 0)
          .to("[data-cover-wrap]", { y: -80, opacity: 0, ease: "none" }, 0.1)

        return () => stopWaiting()
      })
      // Keep pinned positions correct once fonts and images settle.
      const refresh = () => ScrollTrigger.refresh()
      window.addEventListener("load", refresh)
      return () => {
        window.removeEventListener("load", refresh)
        mm.revert()
      }
    },
    { scope: root }
  )

  return (
    <section ref={root} aria-labelledby="hero-title" className="grain relative h-[100svh] min-h-[620px] overflow-hidden bg-brand-graphite-dark">
      {backdrop && (
        <div data-backdrop className="absolute inset-0 scale-110">
          <Picture image={backdrop} sizes="100vw" priority className="h-full w-full object-cover object-[50%_20%]" />
          <div data-blur className="absolute inset-0" aria-hidden>
            <Picture image={backdrop} sizes="50vw" className="h-full w-full scale-110 object-cover object-[50%_20%] blur-2xl" />
          </div>
        </div>
      )}
      <div
        data-veil
        className="absolute inset-0 bg-gradient-to-b from-brand-graphite-dark/90 via-brand-graphite-dark/65 to-brand-graphite-dark/10 md:bg-gradient-to-r md:via-brand-graphite-dark/55 md:to-brand-graphite-dark/20"
      />

      <div className="relative z-10 mx-auto flex h-full max-w-editorial flex-col px-5 pb-8 pt-24 md:px-10 md:pt-28">
        <div className="flex flex-1 flex-col justify-center gap-10 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <p data-intro className="font-hud flex items-center gap-2 text-[11px] text-brand-accent">
              <span className="inline-block h-2 w-2 animate-pulse bg-brand-accent" aria-hidden />
              <span data-status>Game paused</span>
            </p>

            <div data-paused aria-hidden className="mt-4 flex items-end gap-[0.12em] text-[20vw] md:text-[min(12.5vw,13rem)]">
              <span className="flex h-[0.72em] gap-[0.09em] pb-[0.03em]">
                <span data-pause-bar className="block w-[0.13em] origin-bottom bg-brand-accent" />
                <span data-pause-bar className="block w-[0.13em] origin-bottom bg-brand-accent" />
              </span>
              <span className="display flex overflow-hidden pb-[0.02em] leading-[0.8]">
                {"PAUSED".split("").map((c, i) => (
                  <span key={i} data-char className="inline-block">
                    {c}
                  </span>
                ))}
              </span>
            </div>

            <div data-hero-copy>
              <h1 id="hero-title" data-intro className="mt-6 max-w-xl text-2xl font-semibold leading-tight md:text-3xl">
                {settings.heroTitle}
              </h1>
              {settings.heroSubtitle && (
                <p data-intro className="mt-3 max-w-md text-brand-bone/70">
                  {settings.heroSubtitle}
                </p>
              )}
            </div>

            <nav data-menu aria-label="Pause menu" className="relative mt-8 max-w-sm">
              <span ref={indicator} aria-hidden className="absolute left-0 top-0 h-11 w-1 bg-brand-accent" />
              <ul>
                {menu.map((item) => (
                  <li key={item.href} data-intro>
                    <a
                      href={item.href}
                      onPointerEnter={(e) => moveIndicator(e.currentTarget)}
                      onFocus={(e) => moveIndicator(e.currentTarget)}
                      className="group flex h-11 items-center justify-between gap-6 pl-5 pr-2 transition-colors hover:bg-white/5 focus-visible:bg-white/5"
                    >
                      <span className="display text-xl leading-none transition-transform duration-300 group-hover:translate-x-1 md:text-2xl">{item.label}</span>
                      <span className="font-hud text-[10px] text-brand-bone/50">{item.hint}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {product && cover && (
            <div data-cover-wrap className="hidden w-[min(30vw,380px)] shrink-0 md:block">
              <Link data-intro href={`/products/${product.slug}/`} className="group block">
                <div data-cover className="hud-frame relative aspect-[4/5] overflow-hidden bg-brand-stone text-brand-graphite">
                  <Picture image={cover} sizes="380px" priority className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-hud text-[10px] text-brand-accent">Featured item</p>
                    <p className="display mt-1 text-xl leading-none">{product.name}</p>
                  </div>
                  <p className="font-hud text-sm tracking-normal">{formatBdt(product.priceBdt)}</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div data-hero-foot>
        <div data-intro className="flex items-center justify-between gap-6 font-hud text-[10px] text-brand-bone/50">
          <span className="flex items-center gap-3">
            <span className="relative block h-8 w-px overflow-hidden bg-white/20" aria-hidden>
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-hint_1.6s_ease-in-out_infinite] bg-brand-accent" />
            </span>
            Scroll to resume
          </span>
          <span className="hidden md:inline">Made in Bangladesh</span>
        </div>
        </div>
      </div>
    </section>
  )
}
