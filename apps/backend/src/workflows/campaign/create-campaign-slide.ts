import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CAMPAIGN_MODULE } from "../../modules/campaign"

export type CreateCampaignSlideInput = {
  title: string
  subtitle?: string | null
  eyebrow?: string | null
  description?: string | null
  desktop_image_url: string
  mobile_image_url?: string | null
  primary_cta_label?: string | null
  primary_cta_url?: string | null
  secondary_cta_label?: string | null
  secondary_cta_url?: string | null
  text_alignment?: "left" | "center" | "right"
  focal_position?: string
  overlay_strength?: "none" | "subtle" | "medium" | "strong"
  display_order?: number
  is_active?: boolean
  status?: "draft" | "published"
  starts_at?: Date | string | null
  ends_at?: Date | string | null
  metadata?: Record<string, unknown> | null
}

export const createCampaignSlideStep = createStep(
  "create-campaign-slide",
  async (input: CreateCampaignSlideInput, { container }) => {
    const campaignService = container.resolve(CAMPAIGN_MODULE) as any
    const slide = await campaignService.createCampaignSlides(input)

    return new StepResponse(slide, slide.id)
  },
  async (id: string, { container }) => {
    const campaignService = container.resolve(CAMPAIGN_MODULE) as any
    await campaignService.deleteCampaignSlides(id)
  }
)

export const createCampaignSlideWorkflow = createWorkflow(
  "create-campaign-slide",
  (input: CreateCampaignSlideInput) => {
    const slide = createCampaignSlideStep(input)
    return new WorkflowResponse(slide)
  }
)
