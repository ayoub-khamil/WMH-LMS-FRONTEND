import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { downloadCertificatePDF } from '../../services/certificate';
import { IconAcademicCap, IconDownload, IconCheck } from '../common/Icons';

export function CourseCompleteModal({ isOpen, onClose, course, agentName, onReturnToDashboard }) {
  if (!isOpen || !course) return null;

  const handleDownload = () => {
    downloadCertificatePDF({
      agentName: agentName || 'Frontline Specialist',
      courseTitle: course.title,
      completionDate: new Date().toISOString(),
      courseId: course.id
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Course Curriculum Completed" maxWidth="max-w-lg">
      <div className="text-center py-4 space-y-5">
        <div className="w-16 h-16 rounded-full border border-watermelon-green-400 bg-watermelon-green-50 dark:bg-watermelon-green-950/50 text-watermelon-green-600 dark:text-watermelon-green-400 flex items-center justify-center mx-auto">
          <IconAcademicCap className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Congratulations, {agentName}!
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You have successfully completed the course:
          </p>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {course.title}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={handleDownload}
            className="w-full sm:w-auto"
          >
            <IconDownload className="w-4 h-4" />
            <span>Download PDF Certificate</span>
          </Button>
          <Button
            variant="secondary"
            onClick={onReturnToDashboard}
            className="w-full sm:w-auto"
          >
            <span>Return to Learning Path</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
