// Realistic sample CVs across different domains to demo the agent with one click.

export const SAMPLE_CVS = {
  embedded: {
    label: "Embedded Systems Engineer (Tunisia)",
    role: "Embedded & IoT Engineer",
    text: `CH AMINE
Electrical & Embedded Systems Engineer | Tunis, Tunisia | amine.chtiwi55@gmail.com | +216.29246064
Bayt.com: people.bayt.com/ch-amine | LinkedIn: linkedin.com/in/amine-chtiwi

PROFESSIONAL SUMMARY
Electrical engineer specializing in embedded systems, microcontrollers (STM32, ESP32, Arduino), real-time firmware development, and IoT communication protocols (LoRa, BLE, MQTT). Hands-on experience with PCB prototyping, FPGA/VHDL digital design, real-time data acquisition, and automated industrial test benches.

EXPERIENCE
Embedded Systems Engineering Intern — ACTIA Engineering Services (Tunis) | 2024 - Present
- Developed STM32 (ARM Cortex-M4) firmware in Embedded C for automotive telematics and CAN bus diagnostics.
- Implemented low-power LoRa sensor telemetry node with real-time acquisition and cloud gateway connectivity.
- Built automated test suites in Python for hardware-in-the-loop (HIL) verification of electronic control units.

Firmware & IoT Project Lead — National Engineering School (ENIT) | 2023 - 2024
- Designed custom STM32 + ESP32 monitoring system for photovoltaic installations with real-time web dashboard.
- Implemented digital filters in VHDL on Xilinx Spartan FPGA for high-frequency signal acquisition.
- Designed 2-layer PCB in KiCAD, performed board bring-up, and soldered SMD components.

SKILLS
Hard Skills: STM32, ARM Cortex-M, Embedded C/C++, FreeRTOS, ESP32, Arduino, LoRa, CAN bus, I2C, SPI, UART, FPGA/VHDL, KiCAD, Python, Linux Embedded, Real-time debugging (JTAG/SWD), Oscilloscopes.
Soft Skills: Technical Problem Solving, Cross-functional Teamwork, Project Management, Agile/Scrum.
Languages: English (Fluent), French (Fluent), Arabic (Native).

EDUCATION
National Engineering Diploma in Electrical Engineering & Embedded Systems (2020 - 2025)
National Engineering School of Tunis (ENIT)`
  },
  product: {
    label: "Senior Product Manager (SaaS)",
    role: "Senior Product Manager",
    text: `JANE OKAFOR
Senior Product Manager | Lagos, Nigeria & Remote | jane.okafor@email.com | linkedin.com/in/janeokafor

PROFESSIONAL SUMMARY
Product Leader with 6+ years of experience scaling B2B SaaS and FinTech platforms from 0 to 1 and growth phase. Track record of owning product roadmaps, leading cross-functional squads of engineers and designers, and driving user activation and retention.

EXPERIENCE
Senior Product Manager — Paystack (Lagos) | 2022 - Present
- Own merchant onboarding and payouts roadmap serving 200k+ African and global businesses.
- Reduced onboarding drop-off by 38% and improved time-to-first-payout by 4 days through A/B testing.
- Conduct continuous user research; translate business requirements into PRDs and prioritized sprint backlogs.

Product Manager — Flutterwave (Lagos) | 2020 - 2022
- Led invoicing and multi-currency billing products used by 40k+ SMEs across 5 emerging markets.
- Shipped automated KYC compliance flow that increased merchant verification conversion by 24%.

SKILLS
Hard: Product Strategy, Roadmapping, User Research, A/B Testing, SQL, Mixpanel, Amplitude, Looker, Jira, Figma, API Design, Go-to-Market, Growth Metrics.
Soft: Executive Stakeholder Management, Strategic Thinking, Mentorship, Data-Driven Decision Making.

EDUCATION
B.Sc. Computer Science — University of Lagos (2014 - 2018)`
  },
  fullstack: {
    label: "Full-Stack AI Developer",
    role: "Senior Full-Stack Engineer",
    text: `ALEX CHEN
Senior Full-Stack AI Engineer | Remote / Worldwide | alex.chen@dev.io | github.com/alexchen-dev

PROFESSIONAL SUMMARY
Full-Stack Engineer with 5 years of experience building modern Next.js/React web applications and integrating Generative AI & LLM workflows. Deep expertise in TypeScript, Node.js, PostgreSQL, vector search, and cloud-native serverless deployments.

EXPERIENCE
Senior Full-Stack Engineer — Vercel / AI Ecosystem | 2023 - Present
- Built real-time LLM-powered recruitment and intelligence streaming dashboards using Next.js 15 and Server-Sent Events.
- Optimized PostgreSQL database queries and Prisma ORM indexing for sub-50ms latency at high concurrency.
- Deployed multi-tenant SaaS architectures on Vercel and AWS with automated CI/CD pipelines.

Full-Stack Developer — TechScale Inc | 2021 - 2023
- Built responsive React dashboards and backend REST/GraphQL microservices in TypeScript and Node.js.
- Integrated payment gateways (Stripe) and authentication systems (OAuth2, JWT).

SKILLS
Hard Skills: TypeScript, React, Next.js, Node.js, PostgreSQL, Tailwind CSS, Prisma, Redis, Docker, REST APIs, GraphQL, Python, LLM Integration, Vector Databases.
Soft Skills: System Architecture, Code Review, Fast Prototyping, Technical Writing.

EDUCATION
B.S. Software Engineering (2017 - 2021)`
  }
};

export const SAMPLE_CV = SAMPLE_CVS.embedded.text;
