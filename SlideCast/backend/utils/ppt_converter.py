
import os
import sys
import traceback

def convert_to_pdf(input_path, output_path):
    try:
        # Check if input file exists
        if not os.path.exists(input_path):
            print(f"Error: Input file does not exist: {input_path}")
            return False
            
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}")
            
        # Convert paths to absolute
        abs_input_path = os.path.abspath(input_path)
        abs_output_path = os.path.abspath(output_path)
        
        print(f"Converting {abs_input_path} to {abs_output_path}")
        
        try:
            # Try to import win32com
            import win32com.client
            
            # Initialize PowerPoint
            print("Initializing PowerPoint...")
            powerpoint = win32com.client.Dispatch("Powerpoint.Application")
            powerpoint.Visible = True  # Make it visible to handle any dialogs
            
            # Open the presentation
            print("Opening presentation...")
            presentation = powerpoint.Presentations.Open(abs_input_path)
            
            # Save as PDF (formatType = 32 for PDF)
            print("Saving as PDF...")
            presentation.SaveAs(abs_output_path, 32)
            
            # Close everything
            presentation.Close()
            powerpoint.Quit()
            
            # Verify the output file exists
            if os.path.exists(abs_output_path):
                print(f"PDF created successfully: {abs_output_path}")
                print(f"PDF file size: {os.path.getsize(abs_output_path)} bytes")
                return True
            else:
                print(f"Error: Output file was not created: {abs_output_path}")
                return False
                
        except ImportError:
            print("Error: win32com module not found. Please install it with 'pip install pywin32'")
            return False
            
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        print("Traceback:")
        print(traceback.format_exc())
        
        # Ensure PowerPoint is closed
        try:
            presentation.Close()
            powerpoint.Quit()
        except:
            pass
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: script.py <input_path> <output_path>")
        sys.exit(1)
    
    success = convert_to_pdf(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
