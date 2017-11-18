namespace CallCenter
{
    partial class UserControlCallInfo
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.labelTime = new System.Windows.Forms.Label();
            this.labelStatus = new System.Windows.Forms.Label();
            this.labelAddress = new System.Windows.Forms.Label();
            this.labelInputAddress = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // labelTime
            // 
            this.labelTime.AutoSize = true;
            this.labelTime.Enabled = false;
            this.labelTime.ForeColor = System.Drawing.SystemColors.ControlText;
            this.labelTime.Location = new System.Drawing.Point(10, 3);
            this.labelTime.Name = "labelTime";
            this.labelTime.Size = new System.Drawing.Size(108, 13);
            this.labelTime.TabIndex = 0;
            this.labelTime.Text = "8:00 AM 01/01/2010";
            // 
            // labelStatus
            // 
            this.labelStatus.AutoSize = true;
            this.labelStatus.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelStatus.ForeColor = System.Drawing.SystemColors.ControlText;
            this.labelStatus.Location = new System.Drawing.Point(12, 116);
            this.labelStatus.Name = "labelStatus";
            this.labelStatus.Size = new System.Drawing.Size(92, 16);
            this.labelStatus.TabIndex = 1;
            this.labelStatus.Text = "Đã có xe nhận";
            // 
            // labelAddress
            // 
            this.labelAddress.Enabled = false;
            this.labelAddress.Font = new System.Drawing.Font("Verdana", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelAddress.ForeColor = System.Drawing.Color.Black;
            this.labelAddress.Location = new System.Drawing.Point(12, 17);
            this.labelAddress.Name = "labelAddress";
            this.labelAddress.Size = new System.Drawing.Size(194, 47);
            this.labelAddress.TabIndex = 2;
            this.labelAddress.Text = "labelAddress";
            // 
            // labelInputAddress
            // 
            this.labelInputAddress.Enabled = false;
            this.labelInputAddress.Font = new System.Drawing.Font("Verdana", 9F, System.Drawing.FontStyle.Italic, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelInputAddress.ForeColor = System.Drawing.Color.Black;
            this.labelInputAddress.Location = new System.Drawing.Point(12, 69);
            this.labelInputAddress.Name = "labelInputAddress";
            this.labelInputAddress.Size = new System.Drawing.Size(194, 47);
            this.labelInputAddress.TabIndex = 3;
            this.labelInputAddress.Text = "labelInputAddress";
            // 
            // UserControlCallInfo
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.Controls.Add(this.labelInputAddress);
            this.Controls.Add(this.labelAddress);
            this.Controls.Add(this.labelStatus);
            this.Controls.Add(this.labelTime);
            this.ForeColor = System.Drawing.SystemColors.ControlText;
            this.Name = "UserControlCallInfo";
            this.Size = new System.Drawing.Size(209, 132);
            this.Load += new System.EventHandler(this.UserControlCallInfo_Load);
            this.MouseClick += new System.Windows.Forms.MouseEventHandler(this.UserControlCallInfo_MouseClick);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label labelTime;
        private System.Windows.Forms.Label labelStatus;
        private System.Windows.Forms.Label labelAddress;
        private System.Windows.Forms.Label labelInputAddress;
    }
}
