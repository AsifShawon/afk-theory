import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261021000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      create table if not exists "campaign_slide" (
        "id" text not null,
        "title" text not null,
        "subtitle" text null,
        "eyebrow" text null,
        "description" text null,
        "desktop_image_url" text not null,
        "mobile_image_url" text null,
        "primary_cta_label" text null,
        "primary_cta_url" text null,
        "secondary_cta_label" text null,
        "secondary_cta_url" text null,
        "text_alignment" text not null default 'left',
        "focal_position" text not null default 'center',
        "overlay_strength" text not null default 'medium',
        "display_order" integer not null default 0,
        "is_active" boolean not null default true,
        "status" text not null default 'published',
        "starts_at" timestamptz null,
        "ends_at" timestamptz null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "campaign_slide_pkey" primary key ("id")
      );
    `)

    this.addSql(`
      create table if not exists "announcement_bar" (
        "id" text not null,
        "text" text not null,
        "link_url" text null,
        "is_active" boolean not null default true,
        "desktop_autoplay" boolean not null default false,
        "autoplay_interval_ms" integer not null default 6000,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "announcement_bar_pkey" primary key ("id")
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "campaign_slide" cascade;`)
    this.addSql(`drop table if exists "announcement_bar" cascade;`)
  }
}
