// src/emails/__scaffold.tsx
// Phase 45 -- react-email proof-of-pipeline component.
//
// Purpose: prove that brand tokens flow through `@react-email/tailwind`
// into rendered HTML with literal hex values (D-06 mirror works end-to-end).
// NOT used at runtime; replaced by real templates in Phase 46.
//
// The component intentionally exercises every brand-token category once:
//   - color (bg-cream, bg-terracotta, text-charcoal, text-charcoal-light, text-white)
//   - font (font-heading, font-body)
//   - spacing (max-w-xl, py-10, px-5 -- standard Tailwind; the brand-token spacing
//     scale is not used in this scaffold since `--spacing-section: 8rem` is portal-
//     only sizing. Phase 46 templates may use `m-section-sm` etc. as appropriate.)

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Tailwind,
  Text,
} from "@react-email/components";
import { emailTailwindConfig } from "./_theme";

export interface ScaffoldProps {
  recipientName?: string;
}

export function Scaffold({ recipientName = "Sample Recipient" }: ScaffoldProps) {
  return (
    <Html lang="en">
      <Head />
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-cream font-body">
          <Container className="mx-auto max-w-xl py-10 px-5">
            <Heading className="text-2xl text-charcoal font-heading">
              {`Hello, ${recipientName}`}
            </Heading>
            <Text className="text-base text-charcoal-light leading-7">
              Brand-token round-trip works.
            </Text>
            <Button
              href="https://lasprezz.com"
              className="bg-terracotta text-white px-6 py-3 no-underline"
            >
              View
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default Scaffold;
