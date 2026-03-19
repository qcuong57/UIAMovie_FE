// src/components/Footer.jsx

import React from 'react';
import { motion } from 'framer-motion';
import * as transitions from '../../motion-configs/transitions';

const footerSections = [
  { title: 'Company', links: ['About Us', 'Careers', 'Press'] },
  { title: 'Support', links: ['Help Center', 'Contact Us', 'FAQ'] },
  { title: 'Legal', links: ['Terms', 'Privacy', 'Cookies'] },
  { title: 'Follow Us', links: ['Twitter', 'Facebook', 'Instagram'] },
];

const Footer = () => {
  return (
    <motion.footer
      className="border-t border-gray-800 px-4 md:px-8 py-12 mt-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={transitions.TRANSITION_NORMAL}
      viewport={{ once: true }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        {footerSections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.TRANSITION_NORMAL, delay: idx * 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-white mb-4">{section.title}</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              {section.links.map((link) => (
                <li key={link} className="hover:text-white transition">
                  {link}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </motion.footer>
  );
};

export default Footer;