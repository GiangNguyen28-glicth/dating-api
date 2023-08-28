import cv2
import mediapipe as mp

# Khởi tạo các thành phần của Mediapipe
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

# Khởi tạo Face Detection module
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.5)

# Khởi tạo webcam hoặc đọc video từ file
cap = cv2.VideoCapture('E:/Nestjs/date-api/detect-face.mp4')
print(cap.isOpened())
while cap.isOpened():
    print("Hello world")
    ret, frame = cap.read()
    if not ret:
        break
    
    # Chuyển đổi frame sang RGB
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Detect khuôn mặt trong frame
    results = face_detection.process(frame_rgb)
    
    # Vẽ bounding box cho các khuôn mặt đã phát hiện
    if results.detections:
        print(results.detections)
        for detection in results.detections:
            bboxC = detection.location_data.relative_bounding_box
            ih, iw, _ = frame.shape
            x, y, w, h = int(bboxC.xmin * iw), int(bboxC.ymin * ih), int(bboxC.width * iw), int(bboxC.height * ih)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    # Hiển thị frame với bounding box
    cv2.imshow('Face Detection', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
