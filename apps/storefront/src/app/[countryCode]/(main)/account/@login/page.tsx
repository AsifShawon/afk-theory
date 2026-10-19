import { Metadata } from "next"
import { constructMetadata } from "@lib/util/seo"
import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = constructMetadata({
  title: "Sign In | AFK THEORY",
  description: "Sign in to your AFK THEORY customer account.",
  noIndex: true,
})

export default function Login() {
  return <LoginTemplate />
}
