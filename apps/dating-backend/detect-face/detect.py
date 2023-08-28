import cv2
import mediapipe as mp

# Khởi tạo thư viện Mediapipe
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

# Định nghĩa hàm để đếm thời gian khuôn mặt xuất hiện trong video
def detect_face_duration(video_path, min_duration=7):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Không thể mở video.")
        return False

    face_duration = 0

    with mp_face_detection.FaceDetection(min_detection_confidence=0.5) as face_detection:
        while cap.isOpened():
            ret, frame = cap.read()
            if ret is False:
                break

            # Chuyển frame sang định dạng RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Phát hiện khuôn mặt trong frame
            results = face_detection.process(frame_rgb)

            if results.detections:
                # Tăng thời gian nếu có khuôn mặt được phát hiện trong frame
                for detection in results.detections:
                    bboxC = detection.location_data.relative_bounding_box
                    ih, iw, _ = frame.shape
                    face_area = ih * iw * bboxC.width * bboxC.height
                    if face_area > 0.5:
                        face_duration += 1 / cap.get(cv2.CAP_PROP_FPS)

            # Hiển thị frame với bounding box
            for detection in results.detections:
                mp_drawing.draw_detection(frame, detection)

            cv2.imshow('Frame', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

    return face_duration >= min_duration

# Thực hiện đếm thời gian khuôn mặt xuất hiện trong video
video_path = 'E:/Nestjs/date-api/detect-face/detect.mp4'
is_face_present = detect_face_duration(video_path)

if is_face_present:
    print("Khuôn mặt xuất hiện hơn 7s trong video.")
else:
    print("Khuôn mặt xuất hiện ít hơn 7s trong video.")
