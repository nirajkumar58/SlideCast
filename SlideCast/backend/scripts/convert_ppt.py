
import sys
import os
import win32com.client
import pythoncom

def convert_to_pdf(input_file, output_file):
    try:
        # Initialize COM
        pythoncom.CoInitialize()
        
        # Create PowerPoint application
        powerpoint = win32com.client.Dispatch("PowerPoint.Application")
        powerpoint.Visible = False

        try:
            # Open the presentation
            presentation = powerpoint.Presentations.Open(input_file)
            
            # Save as PDF
            presentation.SaveAs(output_file, 32)  # 32 = PDF format
            
            # Close presentation
            presentation.Close()
            
            return True
        finally:
            # Quit PowerPoint
            powerpoint.Quit()
            pythoncom.CoUninitialize()
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_file> <output_file>")
        sys.exit(1)

    input_file = os.path.abspath(sys.argv[1])
    output_file = os.path.abspath(sys.argv[2])

    if not os.path.exists(input_file):
        print(f"Input file not found: {input_file}")
        sys.exit(1)

    success = convert_to_pdf(input_file, output_file)
    if not success:
        sys.exit(1)
