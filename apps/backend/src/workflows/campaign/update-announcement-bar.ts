import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CAMPAIGN_MODULE } from "../../modules/campaign"

export type UpdateAnnouncementBarInput = {
  text: string
  link_url?: string | null
  is_active?: boolean
  desktop_autoplay?: boolean
  autoplay_interval_ms?: number
}

export const updateAnnouncementBarStep = createStep(
  "update-announcement-bar",
  async (input: UpdateAnnouncementBarInput, { container }) => {
    const campaignService = container.resolve(CAMPAIGN_MODULE) as any
    const existing = await campaignService.listAnnouncementBars({}, { take: 1 })

    let record: any
    let prev: any = null

    if (existing && existing.length > 0) {
      prev = existing[0]
      record = await campaignService.updateAnnouncementBars({
        id: prev.id,
        ...input,
      })
    } else {
      record = await campaignService.createAnnouncementBars(input)
    }

    return new StepResponse(record, { prev, id: record.id })
  },
  async (revertData: { prev: any; id: string }, { container }) => {
    const campaignService = container.resolve(CAMPAIGN_MODULE) as any
    if (revertData.prev) {
      await campaignService.updateAnnouncementBars({
        id: revertData.prev.id,
        ...revertData.prev,
      })
    } else if (revertData.id) {
      await campaignService.deleteAnnouncementBars(revertData.id)
    }
  }
)

export const updateAnnouncementBarWorkflow = createWorkflow(
  "update-announcement-bar",
  (input: UpdateAnnouncementBarInput) => {
    const record = updateAnnouncementBarStep(input)
    return new WorkflowResponse(record)
  }
)
