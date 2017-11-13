using FireSharp;
using FireSharp.Config;
using FireSharp.Interfaces;
using FireSharp.Response;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CallCenter
{
    public partial class Form1 : Form
    {
        private Dictionary<string, CallInfo> calls = new Dictionary<string, CallInfo>();
        public Form1()
        {
            InitializeComponent();
            FirebaseConfig();
        }

        private void buttonSend_Click(object sender, EventArgs e)
        {
            string callId = "";
            string phoneNumber = textBoxPhoneNumber.Text;
            DateTime callDate = DateTime.Now;
            string inputAddress = textBoxAddress.Text;
            string address = "";
            int type = GetGrabType();
            string note = textBoxNote.Text;
            int status = ConstantValue.UNLOCATED;
            float latitude = 0;
            float longitude = 0;
            var callInfo = new CallInfo
            {
                CallId = callId,
                CallDate = callDate,
                PhoneNumber = phoneNumber,
                Address = address,
                InputAddress = inputAddress,
                Type = type,
                Note = note,
                Status = status,
                Latitude = latitude,
                Longtitude = longitude,
            };

            PushAsync(callInfo);
            ClearHistory();
            ResetTextboxForNewCall();
        }

        private void ClearHistory()
        {
            flowLayoutPanelHistory.Controls.Clear();
        }

        private int GetGrabType()
        {
            string selectedText = "";
            foreach (Control control in this.panelGrabType.Controls)
            {
                if (control is RadioButton)
                {
                    RadioButton radio = control as RadioButton;
                    if (radio.Checked)
                    {
                        selectedText = radio.Text;
                    }
                }
            }

            switch (selectedText)
            {
                case "Premium":
                    return ConstantValue.PREMIUM;
                default:
                    return ConstantValue.STANDARD;

            }
        }

        private async void PushAsync(CallInfo callInfo)
        {
            PushResponse response = await client.PushAsync("callHistory", callInfo);
        }

        private async Task<Dictionary<string, CallInfo>> GetListAsync()
        {
            FirebaseResponse response = await client.GetAsync("callHistory");
            string tmp = response.Body;
            //Dictionary<string, CallInfo> list = JsonConvert.DeserializeObject<Dictionary<string, CallInfo>>(tmp);
            Dictionary<string, CallInfo> list = response.ResultAs<Dictionary<string, CallInfo>>();
            return list;
        }

        IFirebaseClient client;
        private void FirebaseConfig()
        {
            IFirebaseConfig config = new FirebaseConfig
            {
                AuthSecret = ConstantValue.AUTH_SECRET,
                BasePath = ConstantValue.BASE_PATH
            };
            client = new FirebaseClient(config);
        }

        private void buttonSetPhoneNumber_Click(object sender, EventArgs e)
        {
            //var getHistory = GetListAsync();
            //var list = await getHistory;
            textBoxPhoneNumber.Enabled = false;
            textBoxAddress.Enabled = true;
            textBoxNote.Enabled = true;
            string phoneNumber = textBoxPhoneNumber.Text;
            LoadHistory(phoneNumber);
        }

        private void LoadHistory(string phoneNumber)
        {
            //load những cuộc gọi trước đó của sdt phoneNumber
            foreach (var call in calls)
            {
                if (call.Value.PhoneNumber != null && call.Value.PhoneNumber.CompareTo(phoneNumber) == 0)
                {
                    UserControlCallInfo userControlCallInfo = new UserControlCallInfo(call.Value);
                    flowLayoutPanelHistory.Controls.Add(userControlCallInfo);
                }
            }
        }

        private void buttonCancel_Click(object sender, EventArgs e)
        {
            ResetTextboxForNewCall();
            ClearHistory();
        }

        private void ResetTextboxForNewCall()
        {
            textBoxPhoneNumber.Text = "";
            textBoxPhoneNumber.Enabled = true;
            textBoxAddress.Text = "";
            textBoxAddress.Enabled = false;
            radioButtonStandard.Checked = true;
            textBoxNote.Text = "";
            textBoxNote.Enabled = false;
        }

        private async void Form1_Load(object sender, EventArgs e)
        {
            calls = await GetListAsync();
            textBoxAddress.Enabled = false;
            textBoxNote.Enabled = false;
            radioButtonStandard.Checked = true;
            //await client.OnAsync("callHistory/", OnAdd, null, null);
            //EventStreamResponse response = await client.OnAsync("callHistory", OnAdd, OnUpdate, OnRemove);
        }

        private void OnRemove(object sender, FireSharp.EventStreaming.ValueRemovedEventArgs args, object context)
        {
            string tmp = args.Path;
        }

        private void OnUpdate(object sender, FireSharp.EventStreaming.ValueChangedEventArgs args, object context)
        {
            string tmp = args.OldData;
        }

        private void OnAdd(object sender, FireSharp.EventStreaming.ValueAddedEventArgs args, object context)
        {
            string tmp = args.Data;
        }


    }
}
