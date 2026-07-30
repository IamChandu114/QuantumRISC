`timescale 1ns / 1ps

module mem_wb_tb;

logic clk;
logic reset;
logic enable;

logic [31:0] memory_data_in;
logic [31:0] alu_result_in;
logic [4:0] rd_in;

logic RegWrite_in;
logic MemtoReg_in;

logic [31:0] memory_data_out;
logic [31:0] alu_result_out;
logic [4:0] rd_out;

logic RegWrite_out;
logic MemtoReg_out;

mem_wb dut(.*);

initial begin
    clk = 0;
    forever #5 clk = ~clk;
end

initial begin

    reset = 1;
    enable = 1;

    #15;

    reset = 0;

    memory_data_in = 32'd100;
    alu_result_in = 32'd30;
    rd_in = 5'd5;

    RegWrite_in = 1;
    MemtoReg_in = 1;

    #10;

    $display("--------------------------------");
    $display("MEM/WB Register Test");
    $display("--------------------------------");
    $display("Memory Data : %d", memory_data_out);
    $display("ALU Result  : %d", alu_result_out);
    $display("RD          : %d", rd_out);
    $display("RegWrite    : %b", RegWrite_out);
    $display("MemtoReg    : %b", MemtoReg_out);
    $display("--------------------------------");

    $finish;

end

endmodule