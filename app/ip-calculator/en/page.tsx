import type { Metadata } from 'next';
import IpCalculatorClient from '../IpCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'IPv4 Subnet & CIDR Calculator - Free Online IP Range & Usable Host Calculator',
  description:
    'Free online IPv4 & CIDR subnet calculator! Calculate network address, broadcast address, subnet mask, wildcard mask, usable IP range, and export full IP lists to TXT or CSV.',
  keywords: 'IP Subnet Calculator, CIDR Calculator, IPv4 Calculator, Subnet Mask, Network Address, Broadcast Address, Usable Host Range',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-calculator/',
      en: 'https://tools.cjkuo.net/ip-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/ip-calculator/en/',
    },
  },
  openGraph: {
    title: 'IPv4 Subnet & CIDR Calculator - Free Online IP Range Calculator',
    description: 'Accurately calculate IPv4 / CIDR subnets, network & broadcast IPs, usable host ranges, and export TXT/CSV lists.',
    url: 'https://tools.cjkuo.net/ip-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPv4 Subnet & CIDR Calculator - Free Online IP Range Calculator',
    description: 'Accurately calculate IPv4 / CIDR subnets, network & broadcast IPs, usable host ranges, and export TXT/CSV lists.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'IPv4 Subnet & CIDR Calculator',
  url: 'https://tools.cjkuo.net/ip-calculator/en/',
  description: 'Free online IPv4 & CIDR subnet calculator supporting notation and standard subnet mask math with TXT/CSV export.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is CIDR notation and how does a Subnet Mask divide a network?',
    a: `CIDR (Classless Inter-Domain Routing) uses a slash followed by a prefix number (e.g., /24) to denote the number of contiguous leading bits set to 1 in the subnet mask.

A subnet mask divides a 32-bit IPv4 address into two key portions:

1. Network ID: Determined by the binary 1s in the mask, identifying the logical network segment.
2. Host ID: Determined by the remaining binary 0s, identifying specific host devices within that subnet.

Subnetting allows network administrators to conserve IPv4 address space, minimize broadcast domains, and enhance network security.`,
  },
  {
    q: 'How is the usable host IP count calculated? Why subtract 2?',
    a: `For a prefix length /n, the number of host bits is (32 - n), yielding a total of 2^(32 - n) IP addresses.

In standard subnets, 2 addresses are reserved and cannot be assigned to hosts:

1. Network Address: All host bits set to 0 (e.g., 192.168.1.0), representing the subnet itself for routing tables.
2. Broadcast Address: All host bits set to 1 (e.g., 192.168.1.255), used to broadcast packets to all devices on the subnet.

Therefore, the usable host count formula is 2^(32 - n) - 2. For example, a /24 subnet has 256 total IPs and 254 usable host addresses (.1 to .254).`,
  },
  {
    q: 'What are Private and Public IP addresses? What ranges are defined by RFC 1918?',
    a: `Public IPs are globally routable across the internet and managed by IANA/RIRs. Private IPs are reserved exclusively for Local Area Networks (LANs) and cannot be routed over the public internet without Network Address Translation (NAT).

RFC 1918 defines three private IPv4 address blocks:

1. Class A: 10.0.0.0/8 (10.0.0.0 to 10.255.255.255, 16,777,216 IPs)
2. Class B: 172.16.0.0/12 (172.16.0.0 to 172.31.255.255, 1,048,576 IPs)
3. Class C: 192.168.0.0/16 (192.168.0.0 to 192.168.255.255, 65,536 IPs)

Other special ranges include 127.0.0.0/8 for Loopback and 169.254.0.0/16 for Link-Local (APIPA).`,
  },
  {
    q: 'What are /31 and /32 subnets, and how are they used in point-to-point links or single hosts?',
    a: `Standard point-to-point links traditionally used /30 (4 total IPs with 2 usable), wasting half the addresses.

1. /31 Subnet (RFC 3021):
Subnet mask 255.255.255.254 has only 2 IP addresses. RFC 3021 enables modern routers to utilize both addresses on point-to-point links without dedicated network and broadcast addresses, conserving IPv4 space.

2. /32 Subnet:
Subnet mask 255.255.255.255 represents a single specific host. Commonly used for router Loopback interfaces, specific firewall rules, and host routes in VPN configurations.`,
  },
  {
    q: 'What is a Wildcard Mask (Inverse Mask) and how is it related to a Subnet Mask?',
    a: `A Wildcard Mask (or Inverse Mask) is extensively used in networking equipment (such as Cisco ACLs and OSPF configurations) to specify IP ranges.

It is the bitwise inverse of a subnet mask, calculated by subtracting the subnet mask from 255.255.255.255.

For example:
Subnet mask 255.255.255.0 (/24) yields a wildcard mask of 0.0.0.255.
Subnet mask 255.255.240.0 (/20) yields a wildcard mask of 0.0.15.255.

In ACL rules, a binary 0 bit requires an exact match, while a binary 1 bit indicates a 'don't care' (wildcard) match.`,
  },
  {
    q: 'How are IPv4 dotted-decimal format and binary representations converted?',
    a: `An IPv4 address consists of 32 binary bits divided into 4 segments called octets (8 bits or 1 byte each), separated by dots.

The 8 bit weights in each octet are 128, 64, 32, 16, 8, 4, 2, 1, representing decimal values from 0 to 255.

For example, 192.168.1.1 translates to:
192 = 128 + 64 = 11000000
168 = 128 + 32 + 8 = 10101000
1 = 00000001
1 = 00000001
Resulting 32-bit binary: 11000000.10101000.00000001.00000001.`,
  },
  {
    q: 'Is it secure to calculate IP subnets here? Will the browser freeze when exporting large IP lists?',
    a: `This tool operates entirely on the client side (Zero-Server Architecture):

1. Privacy & Security: All IP addresses, network masks, and subnet topology stay 100% in your browser's local memory. No data is transmitted to external servers or logged in backend databases.

2. High-Performance Non-Blocking Export: When exporting large subnets (such as a /16 with 65,534 hosts) to TXT or CSV, the engine leverages asynchronous yielding chunks to maintain smooth UI responsiveness without freezing the main thread. Exported CSV files include UTF-8 BOM for full Microsoft Excel compatibility.`,
  },
]);

export default function IpCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <IpCalculatorClient lang="en" />
    </>
  );
}
