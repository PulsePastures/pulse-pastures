import sys

file_path = '/Users/kerimakay/.gemini/antigravity/scratch/somnia-pet-arena/frontend/app/page.tsx'

with open(file_path, 'r') as f:
    content = f.read()

replacements = {
    'bg-[#060606]': 'bg-[#7dd3fc]',
    'bg-[#111]': 'bg-[#fefce8]',
    'text-white': 'text-[#2b1b10]',
    'text-cyan-500': 'text-green-700',
    'text-cyan-400': 'text-green-700',
    'bg-cyan-600': 'bg-green-400',
    'bg-cyan-500': 'bg-green-500',
    'bg-cyan-900': 'bg-green-200',
    'bg-cyan-950': 'bg-white',
    'text-gray-400': 'text-gray-800',
    'bg-black/95': 'bg-[#fefce8]',
    'bg-black/80': 'bg-[#fefce8]',
    'border-white/5': 'border-[#4A2F1D]',
    'border-white/10': 'border-[#4A2F1D]',
    'border-white': 'border-[#4A2F1D]',
    'bg-gray-800': 'bg-gray-300',
    'bg-black opacity-30': 'bg-gray-300 opacity-60',
    'shadow-[0_15px_0_0_rgba(0,0,0,1)]': 'shadow-[12px_12px_0_0_rgba(101,67,33,1)]',
    'shadow-[15px_15px_0_0_rgba(0,0,0,1)]': 'shadow-[12px_12px_0_0_rgba(101,67,33,1)]',
    'shadow-[20px_20px_0_0_rgba(0,0,0,1)]': 'shadow-[15px_15px_0_0_rgba(101,67,33,1)]',
    'shadow-[25px_25px_0_0_rgba(0,0,0,1)]': 'shadow-[15px_15px_0_0_rgba(101,67,33,1)]',
    'border-black': 'border-[#4A2F1D]',
    'text-black': 'text-[#2b1b10]',
    ' High-Fidelity Cyber-Farming': ' The Ultimate On-Chain Pasture',
    'bg-black': 'bg-[#4A2F1D]'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w') as f:
    f.write(content)

print('Success')
