using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallCenter
{
    public class CallInfo
    {
        private string callId;

        public string CallId
        {
            get { return callId; }
            set { callId = value; }
        }
        private string phoneNumber;

        public string PhoneNumber
        {
            get { return phoneNumber; }
            set { phoneNumber = value; }
        }
        private DateTime callDate;

        public DateTime CallDate
        {
            get { return callDate; }
            set { callDate = value; }
        }
        private string address;

        public string Address
        {
            get { return address; }
            set { address = value; }
        }
        private int type;

        public int Type
        {
            get { return type; }
            set { type = value; }
        }
        private string note;

        public string Note
        {
            get { return note; }
            set { note = value; }
        }
        private int status;

        public int Status
        {
            get { return status; }
            set { status = value; }
        }

        private float latitude;

        public float Latitude
        {
            get { return latitude; }
            set { latitude = value; }
        }
        private float longtitude;

        public float Longtitude
        {
            get { return longtitude; }
            set { longtitude = value; }
        }
    }
}
