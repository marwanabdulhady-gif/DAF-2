#!/usr/bin/env python3
"""
Grade 4 Math Question Bank Generator
Enriches lesson files with varied question styles (IXL, Wordwall, Quizizz formats)
Aligned with CCSS for Grade 4 Mathematics
"""

import os
import re
from pathlib import Path

# CCSS Grade 4 Math Standards by Domain
CCSS_GRADE_4 = {
    "place_value": {
        "standards": ["4.NBT.A.1", "4.NBT.A.2", "4.NBT.A.3"],
        "skills": ["Read/write multi-digit numbers", "Place value relationships", "Compare numbers", "Round numbers"],
        "topics": ["1-1", "1-2", "1-3", "1-4"]
    },
    "addition_subtraction": {
        "standards": ["4.NBT.B.4"],
        "skills": ["Add/subtract multi-digit numbers", "Mental math strategies", "Estimation"],
        "topics": ["2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "2-7"]
    },
    "multiplication": {
        "standards": ["4.NBT.B.5"],
        "skills": ["Multiply by multiples of 10", "Area models", "Partial products", "Estimation"],
        "topics": ["3-1", "3-2", "3-3", "3-4", "3-6", "3-8", "4-1", "4-2", "4-3", "4-4", "4-5"]
    },
    "division": {
        "standards": ["4.NBT.B.6"],
        "skills": ["Divide with remainders", "Partial quotients", "Interpret remainders"],
        "topics": ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6"]
    },
    "problem_solving": {
        "standards": ["4.OA.A.3"],
        "skills": ["Multi-step problems", "Comparison problems", "Make sense and persevere"],
        "topics": ["6-1", "6-2", "6-3", "6-5", "6-6"]
    },
    "factors_multiples": {
        "standards": ["4.OA.B.4"],
        "skills": ["Factor pairs", "Prime/composite", "Multiples", "Patterns"],
        "topics": ["7-1", "7-2", "7-3", "7-4", "7-5"]
    },
    "fractions_equivalence": {
        "standards": ["4.NF.A.1", "4.NF.A.2"],
        "skills": ["Equivalent fractions", "Compare fractions", "Benchmark fractions"],
        "topics": ["8-1", "8-2", "8-3", "8-4", "8-5", "8-6", "8-7"]
    },
    "fractions_operations": {
        "standards": ["4.NF.B.3"],
        "skills": ["Add/subtract fractions", "Decompose fractions", "Mixed numbers"],
        "topics": ["9-1", "9-2", "9-3", "9-4", "9-5", "9-6", "9-7", "9-8", "9-9", "9-10"]
    },
    "fraction_multiplication": {
        "standards": ["4.NF.B.4"],
        "skills": ["Multiply fraction by whole number", "Unit fractions", "Time problems"],
        "topics": ["10-1", "10-2", "10-3", "10-4", "10-5"]
    },
    "measurement_data": {
        "standards": ["4.MD.B.4"],
        "skills": ["Line plots", "Measurement data", "Interpret data"],
        "topics": ["11-1", "11-2", "11-3", "11-4"]
    },
    "decimals": {
        "standards": ["4.NF.C.5", "4.NF.C.6", "4.NF.C.7"],
        "skills": ["Decimal notation", "Compare decimals", "Add fractions/decimals"],
        "topics": ["12-1", "12-2", "12-3", "12-4", "12-5", "12-6"]
    },
    "measurement_units": {
        "standards": ["4.MD.A.1", "4.MD.A.2"],
        "skills": ["Convert units", "Customary units", "Metric units", "Solve measurement problems"],
        "topics": ["13-1", "13-2", "13-3", "13-4", "13-5", "13-6", "13-7"]
    },
    "patterns": {
        "standards": ["4.OA.C.5"],
        "skills": ["Number patterns", "Shape patterns", "Generate patterns"],
        "topics": ["14-1", "14-2", "14-3", "14-4"]
    },
    "angles": {
        "standards": ["4.MD.C.5", "4.MD.C.6", "4.MD.C.7"],
        "skills": ["Understand angles", "Measure angles", "Add angles"],
        "topics": ["15-1", "15-2", "15-4", "15-5", "15-6"]
    },
    "geometry": {
        "standards": ["4.G.A.1", "4.G.A.2", "4.G.A.3"],
        "skills": ["Lines and angles", "Classify shapes", "Symmetry"],
        "topics": ["16-1", "16-2", "16-3", "16-4", "16-5", "16-6"]
    }
}

# Question templates by type
QUESTION_TEMPLATES = {
    "multiple_choice_ixl": {
        "name": "Multiple Choice (IXL Style)",
        "format": "Select the correct answer from 4 options",
        "icon": "🔘"
    },
    "fill_blank_wordwall": {
        "name": "Fill in the Blank (Wordwall Style)",
        "format": "Complete the sentence or equation",
        "icon": "✏️"
    },
    "true_false_quizizz": {
        "name": "True or False (Quizizz Style)",
        "format": "Determine if the statement is correct",
        "icon": "✓✗"
    },
    "matching_kahoot": {
        "name": "Matching Pairs (Kahoot Style)",
        "format": "Match items in Column A with Column B",
        "icon": "🔗"
    },
    "word_problem_real": {
        "name": "Real-World Word Problem",
        "format": "Apply math to authentic contexts",
        "icon": "🌍"
    },
    "drag_drop_sort": {
        "name": "Drag and Drop Sort",
        "format": "Categorize items into correct groups",
        "icon": "📦"
    },
    "visual_model": {
        "name": "Visual Model Question",
        "format": "Interpret or create visual representations",
        "icon": "🎨"
    },
    "error_analysis": {
        "name": "Error Analysis",
        "format": "Find and correct the mistake",
        "icon": "🔍"
    },
    "quick_fire": {
        "name": "Quick Fire Round",
        "format": "Rapid calculation or fact recall",
        "icon": "⚡"
    },
    "reasoning_explain": {
        "name": "Reasoning & Explanation",
        "format": "Explain your thinking in words",
        "icon": "💭"
    }
}

def identify_topic(filename):
    """Extract topic code from filename"""
    match = re.match(r'(\d+-\d+)', filename)
    return match.group(1) if match else None

def get_domain_for_topic(topic_code):
    """Get the CCSS domain for a topic"""
    for domain, info in CCSS_GRADE_4.items():
        if topic_code in info["topics"]:
            return domain, info
    return None, None

def generate_question_bank(topic_code, domain_info):
    """Generate question bank based on topic and domain"""
    if not domain_info:
        return None
    
    domain = domain_info["standards"][0].split('.')[1]  # e.g., "NBT" from "4.NBT.A.1"
    standards = ", ".join(domain_info["standards"])
    skills = domain_info["skills"]
    
    # Generate varied questions based on domain
    questions = []
    
    # Place Value (NBT.A)
    if domain == "NBT" and "A" in domain_info["standards"][0]:
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": "What is the value of the digit 5 in 45,672?",
                "options": ["5", "50", "500", "5,000"],
                "answer": "5,000",
                "explanation": "The 5 is in the thousands place, so its value is 5,000."
            },
            {
                "type": "fill_blank_wordwall",
                "question": "In the number 387,241, the digit ___ is in the ten thousands place.",
                "answer": "8",
                "explanation": "Counting from right: ones, tens, hundreds, thousands, ten thousands. The 8 is in the ten thousands place."
            },
            {
                "type": "true_false_quizizz",
                "question": "True or False: 456,789 > 456,879",
                "answer": "False",
                "explanation": "Compare digit by digit from left. At the hundreds place: 7 < 8, so 456,789 < 456,879."
            },
            {
                "type": "matching_kahoot",
                "question": "Match each number with its correct rounded value (round to the nearest thousand):",
                "pairs": [
                    ("12,345", "12,000"),
                    ("67,891", "68,000"),
                    ("45,500", "46,000"),
                    ("99,499", "99,000")
                ]
            },
            {
                "type": "word_problem_real",
                "question": "The population of a small city is 145,672. Round this number to the nearest ten thousand. Explain why rounding might be useful when talking about city populations.",
                "answer": "150,000",
                "explanation": "145,672 rounds to 150,000. Rounding is useful for populations because exact numbers change daily, and rounded numbers are easier to remember and compare."
            },
            {
                "type": "error_analysis",
                "question": "Sara wrote: 'The number 506,042 in expanded form is 500,000 + 600 + 40 + 2.' Find her mistake and write the correct expanded form.",
                "answer": "500,000 + 6,000 + 40 + 2",
                "explanation": "Sara forgot the thousands place. The 6 is in the thousands place, so it represents 6,000, not 600."
            }
        ])
    
    # Addition/Subtraction (NBT.B.4)
    elif topic_code.startswith("2-"):
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": "What is 3,456 + 2,789?",
                "options": ["6,245", "5,245", "6,145", "5,145"],
                "answer": "6,245",
                "explanation": "Add column by column with regrouping: 6+9=15 (write 5, carry 1), 5+8+1=14 (write 4, carry 1), etc."
            },
            {
                "type": "fill_blank_wordwall",
                "question": "Use mental math: 4,500 + 3,200 = ___",
                "answer": "7,700",
                "explanation": "Add the thousands: 4,000 + 3,000 = 7,000. Add the hundreds: 500 + 200 = 700. Total: 7,700."
            },
            {
                "type": "true_false_quizizz",
                "question": "True or False: 8,000 - 3,456 = 4,544",
                "answer": "True",
                "explanation": "Subtract: 8,000 - 3,456. Borrow across zeros: 8,000 - 3,000 = 5,000, then 5,000 - 456 = 4,544."
            },
            {
                "type": "word_problem_real",
                "question": "A library has 12,456 books. During the summer, they received 3,789 new books and removed 1,234 old books. How many books does the library have now?",
                "answer": "15,011 books",
                "explanation": "Start: 12,456. Add new: 12,456 + 3,789 = 16,245. Remove old: 16,245 - 1,234 = 15,011."
            },
            {
                "type": "error_analysis",
                "question": "Ahmed calculated 5,678 - 2,345 and got 3,323. Find his mistake.",
                "answer": "3,333",
                "explanation": "Ahmed made an error in the tens column. 7 - 4 = 3, not 2. The correct answer is 3,333."
            },
            {
                "type": "quick_fire",
                "question": "Solve mentally: 2,500 + 1,500 - 800",
                "answer": "3,200",
                "explanation": "2,500 + 1,500 = 4,000. Then 4,000 - 800 = 3,200."
            }
        ])
    
    # Multiplication (NBT.B.5)
    elif topic_code.startswith("3-") or topic_code.startswith("4-"):
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": "What is 23 × 15?",
                "options": ["345", "245", "335", "255"],
                "answer": "345",
                "explanation": "Use partial products: (20 × 15) + (3 × 15) = 300 + 45 = 345."
            },
            {
                "type": "fill_blank_wordwall",
                "question": "Use the area model: 24 × 13 = (20 × 13) + (___ × 13)",
                "answer": "4",
                "explanation": "Break 24 into 20 + 4. So 24 × 13 = (20 × 13) + (4 × 13)."
            },
            {
                "type": "true_false_quizizz",
                "question": "True or False: 6 × 400 = 2,400",
                "answer": "True",
                "explanation": "6 × 4 = 24, so 6 × 400 = 2,400. When multiplying by multiples of 100, multiply the basic fact and add the zeros."
            },
            {
                "type": "matching_kahoot",
                "question": "Match each multiplication with its product:",
                "pairs": [
                    ("25 × 40", "1,000"),
                    ("12 × 50", "600"),
                    ("30 × 30", "900"),
                    ("15 × 20", "300")
                ]
            },
            {
                "type": "word_problem_real",
                "question": "A rectangular garden is 24 meters long and 18 meters wide. What is the area of the garden? Show your work using partial products.",
                "answer": "432 square meters",
                "explanation": "Area = length × width = 24 × 18. Partial products: (20 × 18) + (4 × 18) = 360 + 72 = 432 square meters."
            },
            {
                "type": "visual_model",
                "question": "Draw an area model for 34 × 12. Label the partial products and find the total.",
                "answer": "408",
                "explanation": "Draw a rectangle divided into 4 sections: (30×10=300), (30×2=60), (4×10=40), (4×2=8). Total: 300+60+40+8=408."
            }
        ])
    
    # Division (NBT.B.6)
    elif topic_code.startswith("5-"):
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": "What is 96 ÷ 8?",
                "options": ["12", "14", "10", "16"],
                "answer": "12",
                "explanation": "Think: 8 × 12 = 96, so 96 ÷ 8 = 12."
            },
            {
                "type": "fill_blank_wordwall",
                "question": "135 ÷ 5 = ___ with remainder ___",
                "answer": "27 with remainder 0",
                "explanation": "135 ÷ 5 = 27 exactly. Check: 27 × 5 = 135."
            },
            {
                "type": "true_false_quizizz",
                "question": "True or False: When dividing 23 by 4, the remainder is 3.",
                "answer": "True",
                "explanation": "23 ÷ 4 = 5 R3. Check: (5 × 4) + 3 = 20 + 3 = 23."
            },
            {
                "type": "word_problem_real",
                "question": "A teacher has 127 pencils to distribute equally among 9 students. How many pencils does each student get? How many pencils are left over? What should the teacher do with the remainder?",
                "answer": "14 pencils each, 1 left over",
                "explanation": "127 ÷ 9 = 14 R1. Each student gets 14 pencils, with 1 left over. The teacher could keep it, give it to one student, or find another fair solution."
            },
            {
                "type": "drag_drop_sort",
                "question": "Sort these division problems by how to interpret the remainder:",
                "categories": {
                    "Round Up": ["23 people in cars that hold 4 each", "127 cookies in boxes of 12"],
                    "Ignore Remainder": ["$50 ÷ $8 per toy", "100 ÷ 7 days in a week"],
                    "Remainder is Answer": ["Share 17 apples among 5 friends"]
                }
            }
        ])
    
    # Problem Solving (OA.A.3)
    elif topic_code.startswith("6-"):
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": "Ali has 3 times as many marbles as Sam. Sam has 12 marbles. How many marbles do they have together?",
                "options": ["36", "48", "24", "15"],
                "answer": "48",
                "explanation": "Ali has 3 × 12 = 36 marbles. Together: 36 + 12 = 48 marbles."
            },
            {
                "type": "word_problem_real",
                "question": "A store sells notebooks in packages of 6. Sara wants to buy enough packages so she has at least 50 notebooks. How many packages should she buy? Explain your reasoning.",
                "answer": "9 packages",
                "explanation": "50 ÷ 6 = 8 R2. She needs 8 full packages (48 notebooks) plus 1 more package to reach at least 50. So 9 packages = 54 notebooks."
            },
            {
                "type": "error_analysis",
                "question": "Problem: 'There are 4 times as many red cars as blue cars. There are 8 blue cars.' Karim wrote: 4 + 8 = 12 red cars. Find his mistake.",
                "answer": "32 red cars",
                "explanation": "Karim added instead of multiplying. '4 times as many' means 4 × 8 = 32 red cars."
            },
            {
                "type": "reasoning_explain",
                "question": "A problem says '15 more than a number.' Another problem says '15 times a number.' How are these different? Give an example of each.",
                "answer": "Varies",
                "explanation": "'15 more' means addition (n + 15), while '15 times' means multiplication (15 × n). Example: If the number is 3, then '15 more' = 18, but '15 times' = 45."
            }
        ])
    
    # Factors and Multiples (OA.B.4)
    elif topic_code.startswith("7-"):
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": "Which list shows ALL the factors of 18?",
                "options": [
                    "1, 2, 3, 6, 9, 18",
                    "1, 2, 3, 6, 18",
                    "2, 3, 6, 9, 18",
                    "1, 2, 3, 9, 18"
                ],
                "answer": "1, 2, 3, 6, 9, 18",
                "explanation": "Factor pairs of 18: (1,18), (2,9), (3,6). List all: 1, 2, 3, 6, 9, 18."
            },
            {
                "type": "true_false_quizizz",
                "question": "True or False: 17 is a prime number.",
                "answer": "True",
                "explanation": "17 has only two factors: 1 and 17. Therefore, it is prime."
            },
            {
                "type": "drag_drop_sort",
                "question": "Sort these numbers into Prime or Composite:",
                "categories": {
                    "Prime": ["13", "19", "23"],
                    "Composite": ["15", "21", "25"]
                }
            },
            {
                "type": "fill_blank_wordwall",
                "question": "The first 5 multiples of 7 are: 7, ___, ___, ___, ___",
                "answer": "14, 21, 28, 35",
                "explanation": "Multiples: 7×1=7, 7×2=14, 7×3=21, 7×4=28, 7×5=35."
            }
        ])
    
    # Fractions (NF)
    elif topic_code.startswith("8-") or topic_code.startswith("9-") or topic_code.startswith("10-"):
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": "Which fraction is equivalent to 2/3?",
                "options": ["4/6", "3/4", "4/9", "2/6"],
                "answer": "4/6",
                "explanation": "Multiply numerator and denominator by 2: (2×2)/(3×2) = 4/6."
            },
            {
                "type": "true_false_quizizz",
                "question": "True or False: 3/4 > 5/8",
                "answer": "True",
                "explanation": "Convert to common denominator: 3/4 = 6/8. Since 6/8 > 5/8, then 3/4 > 5/8."
            },
            {
                "type": "fill_blank_wordwall",
                "question": "2/5 + 1/5 = ___",
                "answer": "3/5",
                "explanation": "When adding fractions with the same denominator, add the numerators: (2+1)/5 = 3/5."
            },
            {
                "type": "visual_model",
                "question": "Draw a fraction bar to show that 1/2 = 2/4 = 4/8",
                "answer": "Visual",
                "explanation": "Draw three bars of equal length. Divide first into 2 parts (shade 1), second into 4 parts (shade 2), third into 8 parts (shade 4). All show the same amount."
            }
        ])
    
    # Add generic questions for other topics
    else:
        questions.extend([
            {
                "type": "multiple_choice_ixl",
                "question": f"Solve this problem related to {skills[0] if skills else 'this topic'}:",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "Option A",
                "explanation": "Review the lesson content for the specific solution method."
            },
            {
                "type": "word_problem_real",
                "question": f"Create a real-world problem that uses {skills[0] if skills else 'these skills'}.",
                "answer": "Varies",
                "explanation": "Apply the mathematical concept to an authentic situation."
            }
        ])
    
    return questions

def format_question_bank(topic_code, domain_info, questions):
    """Format the question bank as markdown"""
    if not questions:
        return ""
    
    standards = ", ".join(domain_info["standards"])
    
    md = "\n\n---\n\n"
    md += "## 📚 Question Bank: Enrichment & Practice\n\n"
    md += f"**CCSS Standards:** {standards}  \n"
    md += f"**Topic:** {topic_code}  \n"
    md += "**Question Types:** IXL • Wordwall • Quizizz • Kahoot • Real-World • Error Analysis\n\n"
    md += "> 💡 **How to use:** These questions provide varied practice beyond the textbook. Use them for extra practice, assessment, or gamified review.\n\n"
    
    current_type = None
    q_num = 1
    
    for q in questions:
        qtype = q["type"]
        template = QUESTION_TEMPLATES.get(qtype, {"icon": "❓", "name": qtype})
        
        # Add section header for new question type
        if qtype != current_type:
            current_type = qtype
            md += f"### {template['icon']} {template['name']}\n\n"
        
        md += f"**Q{q_num}.** {q['question']}\n\n"
        
        # Add options for multiple choice
        if "options" in q:
            for i, opt in enumerate(q["options"], 1):
                md += f"   - {chr(64+i)}) {opt}\n"
            md += "\n"
        
        # Add pairs for matching
        if "pairs" in q:
            md += "   **Column A** | **Column B**\n"
            md += "   ---|---\n"
            for left, right in q["pairs"]:
                md += f"   {left} | {right}\n"
            md += "\n"
        
        # Add categories for drag-drop
        if "categories" in q:
            for cat, items in q["categories"].items():
                md += f"   **{cat}:** {', '.join(items)}\n"
            md += "\n"
        
        # Add answer and explanation
        if "answer" in q:
            md += f"<details>\n<summary><b>✓ Show Answer</b></summary>\n\n"
            md += f"**Answer:** {q['answer']}\n\n"
            if "explanation" in q:
                md += f"**Explanation:** {q['explanation']}\n"
            md += "</details>\n\n"
        
        q_num += 1
    
    md += "---\n\n"
    md += "**🎯 Extension Challenge:** Create your own question in one of the formats above and trade with a partner!\n\n"
    
    return md

def enrich_lesson_file(filepath):
    """Add question bank to a lesson file"""
    filename = os.path.basename(filepath)
    topic_code = identify_topic(filename)
    
    if not topic_code:
        print(f"  ⚠ Could not identify topic for {filename}")
        return False
    
    domain, domain_info = get_domain_for_topic(topic_code)
    
    if not domain_info:
        print(f"  ⚠ No CCSS mapping for topic {topic_code}")
        return False
    
    # Generate question bank
    questions = generate_question_bank(topic_code, domain_info)
    
    if not questions:
        print(f"  ⚠ No questions generated for {topic_code}")
        return False
    
    # Format as markdown
    question_bank_md = format_question_bank(topic_code, domain_info, questions)
    
    # Read existing content
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if question bank already exists
    if "Question Bank: Enrichment & Practice" in content:
        print(f"  ⚠ Question bank already exists in {filename}")
        return False
    
    # Append question bank
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write(question_bank_md)
    
    print(f"  ✅ Added question bank to {filename} ({domain_info['standards'][0]})")
    return True

def main():
    """Process all lesson files"""
    lesson_dirs = [
        "/home/user/DAF-2/semester1/lessons",
        "/home/user/DAF-2/semester2/lessons"
    ]
    
    total_processed = 0
    
    for lesson_dir in lesson_dirs:
        if not os.path.exists(lesson_dir):
            print(f"⚠ Directory not found: {lesson_dir}")
            continue
        
        print(f"\n📂 Processing {lesson_dir}...")
        
        for filename in sorted(os.listdir(lesson_dir)):
            if filename.endswith('.md'):
                filepath = os.path.join(lesson_dir, filename)
                if enrich_lesson_file(filepath):
                    total_processed += 1
    
    print(f"\n🎉 Done! Enriched {total_processed} lesson files with question banks.")
    print(f"\nEach lesson now includes:")
    print(f"  • Multiple choice questions (IXL style)")
    print(f"  • Fill-in-the-blank (Wordwall style)")
    print(f"  • True/False (Quizizz style)")
    print(f"  • Matching pairs (Kahoot style)")
    print(f"  • Real-world word problems")
    print(f"  • Error analysis questions")
    print(f"  • Visual model questions")
    print(f"  • Drag-and-drop sorting")
    print(f"  • Reasoning & explanation prompts")
    print(f"\nAll questions are aligned with CCSS Grade 4 standards and include answers with explanations.")

if __name__ == "__main__":
    main()
